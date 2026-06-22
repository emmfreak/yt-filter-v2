"use strict";

(function () {
  const YTF = window.YTF;

  // ---------------------------------------------------------------------------
  // Shared helpers
  // ---------------------------------------------------------------------------

  // Collect all badge text strings from a card.
  // Source: badge-shape confirmed in all three reference captures.
  // Duration ("4:58", "1:02:33") also uses this element — callers that check
  // for status labels must use exact-match; parseDuration() handles time strings.
  function getBadgeTexts(el) {
    const nodes = el.querySelectorAll("badge-shape .yt-badge-shape__text");
    return Array.from(nodes).map((n) => (n.textContent || "").trim().toUpperCase());
  }

  // Collect raw href attribute values (not resolved URLs) from anchor descendants.
  function getHrefs(el) {
    const anchors = el.querySelectorAll("a[href]");
    return Array.from(anchors).map((a) => a.getAttribute("href") || "");
  }

  // Card title — for logging and Mix title detection.
  function getVideoTitle(el) {
    const lockup = el.querySelector("yt-lockup-metadata-view-model h3");
    if (lockup) return (lockup.textContent || "").trim().slice(0, 80);

    const shorts = el.querySelector("h3.shortsLockupViewModelHostMetadataTitle");
    if (shorts) return (shorts.textContent || "").trim().slice(0, 80);

    const video = el.querySelector("#video-title");
    if (video) return (video.textContent || "").trim().slice(0, 80);

    return "(unknown)";
  }

  // ---------------------------------------------------------------------------
  // Livestream  (Fix 4: removed dead ytd-thumbnail-overlay-time-status-renderer)
  // ---------------------------------------------------------------------------

  function isLiveStream(el) {
    // Badge text "LIVE" / "LIVE NOW" — thumbnail badges render before metadata.
    // Source: badge-shape .yt-badge-shape__text confirmed in all three captures.
    const badges = getBadgeTexts(el);
    if (badges.some((t) => t === "LIVE" || t === "LIVE NOW")) return true;

    // "X watching" in metadata text — only present once yt-lockup-metadata-view-model loads.
    const meta = el.querySelector("yt-lockup-metadata-view-model, #metadata-line, #meta");
    if (meta && /\bwatching\b/i.test(meta.textContent)) return true;

    return false;
  }

  // ---------------------------------------------------------------------------
  // Shorts  (Fix 4: removed dead ytd-thumbnail-overlay-time-status-renderer)
  // ---------------------------------------------------------------------------

  function isShort(el) {
    // Tag name is definitive — ytm-shorts-lockup-view-model is exclusively Shorts.
    // Source: search capture, 15 found.
    if (el.tagName === "YTM-SHORTS-LOCKUP-VIEW-MODEL") return true;

    // Link href starts with "/shorts/".
    // Source: a.shortsLockupViewModelHostEndpoint[href="/shorts/ID"] in search capture.
    if (getHrefs(el).some((h) => h.startsWith("/shorts/"))) return true;

    // Badge text "SHORTS".
    if (getBadgeTexts(el).some((t) => t === "SHORTS")) return true;

    return false;
  }

  // ---------------------------------------------------------------------------
  // Mix
  // ---------------------------------------------------------------------------

  function isMix(el) {
    const hrefs = getHrefs(el);
    if (hrefs.some((h) => h.includes("start_radio=1"))) return true;
    if (hrefs.some((h) => /[?&]list=RD/.test(h))) return true;

    if (getBadgeTexts(el).some((t) => t === "MIX")) return true;

    const title = getVideoTitle(el);
    if (/^Mix\s*[-–]/i.test(title)) return true;

    return false;
  }

  // ---------------------------------------------------------------------------
  // Playable
  // ---------------------------------------------------------------------------

  function isPlayable(el) {
    if (getHrefs(el).some((h) => h.includes("/playables/"))) return true;
    if (getBadgeTexts(el).some((t) => t === "PLAYABLE" || t === "PLAY GAME")) return true;
    return false;
  }

  // ---------------------------------------------------------------------------
  // Members-only
  // ---------------------------------------------------------------------------

  function isMembersOnly(el) {
    return getBadgeTexts(el).some((t) => t === "MEMBERS ONLY");
  }

  // ---------------------------------------------------------------------------
  // View count
  // ---------------------------------------------------------------------------

  function isMetadataLoaded(el) {
    const tag = el.tagName;
    if (tag === "YTD-VIDEO-RENDERER" || tag === "YTM-SHORTS-LOCKUP-VIEW-MODEL") return true;
    return el.querySelector("yt-lockup-metadata-view-model") !== null;
  }

  function getViewCount(el) {
    const { extractViewString, parseViewCount } = YTF;

    const lockupMeta = el.querySelector("yt-lockup-metadata-view-model");
    if (lockupMeta) {
      const vs = extractViewString(lockupMeta.textContent);
      if (vs) return parseViewCount(vs);
    }

    const metaLine = el.querySelector("#metadata-line");
    if (metaLine) {
      const vs = extractViewString(metaLine.textContent);
      if (vs) return parseViewCount(vs);
    }

    const metaBlock = el.querySelector("ytd-video-meta-block");
    if (metaBlock) {
      const vs = extractViewString(metaBlock.textContent);
      if (vs) return parseViewCount(vs);
    }

    for (const span of el.querySelectorAll("span")) {
      const txt = (span.textContent || "").trim();
      if (/^no views$/i.test(txt) || /views?$/i.test(txt)) {
        const count = parseViewCount(txt);
        if (!isNaN(count)) return count;
      }
    }

    return NaN;
  }

  // ---------------------------------------------------------------------------
  // Duration
  // ---------------------------------------------------------------------------

  // Duration badge lives inside yt-thumbnail-view-model.
  // For search rows and Shorts the full DOM is synchronous.
  // For lockup cards we check yt-thumbnail-view-model presence as the "loaded" signal.
  function isDurationLoaded(el) {
    const tag = el.tagName;
    if (tag === "YTD-VIDEO-RENDERER" || tag === "YTM-SHORTS-LOCKUP-VIEW-MODEL") return true;
    return el.querySelector("yt-thumbnail-view-model") !== null;
  }

  // Returns total seconds, or NaN if no time-format badge is present.
  // getBadgeTexts() returns uppercase; parseDuration() is case-insensitive for digits/colons.
  function getDuration(el) {
    for (const text of getBadgeTexts(el)) {
      const secs = YTF.parseDuration(text);
      if (!isNaN(secs)) return secs;
    }
    return NaN;
  }

  // ---------------------------------------------------------------------------
  // shouldHide
  // ---------------------------------------------------------------------------

  function shouldHide(el) {
    const s = YTF.settings;

    if (s.hideLivestreams && isLiveStream(el)) {
      return { hide: true, reason: "livestream", indeterminate: false };
    }
    if (s.hideShorts && isShort(el)) {
      return { hide: true, reason: "short", indeterminate: false };
    }
    if (s.hideMixes && isMix(el)) {
      return { hide: true, reason: "mix", indeterminate: false };
    }
    if (s.hidePlayables && isPlayable(el)) {
      return { hide: true, reason: "playable", indeterminate: false };
    }
    if (s.hideMembersOnly && isMembersOnly(el)) {
      return { hide: true, reason: "members-only", indeterminate: false };
    }

    if (s.hideLowViews) {
      if (!isMetadataLoaded(el)) {
        return { hide: false, reason: "", indeterminate: true };
      }
      const views = getViewCount(el);
      if (isNaN(views)) {
        return { hide: false, reason: "", indeterminate: false };
      }
      if (views < s.viewThreshold) {
        return {
          hide: true,
          reason: `low views (${views.toLocaleString()} < ${s.viewThreshold.toLocaleString()})`,
          indeterminate: false,
        };
      }
    }

    if (s.hideShortDuration || s.hideLongDuration) {
      if (!isDurationLoaded(el)) {
        return { hide: false, reason: "", indeterminate: true };
      }
      const secs = getDuration(el);
      if (!isNaN(secs)) {
        const mins = secs / 60;
        if (s.hideShortDuration && mins < s.minDurationMinutes) {
          return {
            hide: true,
            reason: `too short (${YTF.formatDuration(secs)} < ${s.minDurationMinutes}m)`,
            indeterminate: false,
          };
        }
        if (s.hideLongDuration && mins > s.maxDurationMinutes) {
          return {
            hide: true,
            reason: `too long (${YTF.formatDuration(secs)} > ${s.maxDurationMinutes}m)`,
            indeterminate: false,
          };
        }
      }
      // No duration badge on a fully-loaded card (livestream, channel, playlist) — pass.
    }

    return { hide: false, reason: "", indeterminate: false };
  }

  Object.assign(window.YTF, {
    getBadgeTexts,
    getHrefs,
    getVideoTitle,
    isLiveStream,
    isShort,
    isMix,
    isPlayable,
    isMembersOnly,
    isMetadataLoaded,
    getViewCount,
    isDurationLoaded,
    getDuration,
    shouldHide,
  });
})();
