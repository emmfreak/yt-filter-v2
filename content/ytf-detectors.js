"use strict";

(function () {
  const YTF = window.YTF;

  // ---------------------------------------------------------------------------
  // Shared helpers
  // ---------------------------------------------------------------------------

  // Collect all badge text strings from a card (uppercased, for status checks).
  // Source: badge-shape confirmed in all three reference captures.
  function getBadgeTexts(el) {
    const nodes = el.querySelectorAll(`${YTF.SEL_BADGE} .yt-badge-shape__text`);
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
  // Livestream
  // ---------------------------------------------------------------------------

  // Accept pre-computed badgeTexts from shouldHide to avoid re-querying.
  function isLiveStream(el, badgeTexts) {
    if (!badgeTexts) badgeTexts = getBadgeTexts(el);
    if (badgeTexts.some((t) => t === "LIVE" || t === "LIVE NOW")) return true;

    const meta = el.querySelector("yt-lockup-metadata-view-model, #metadata-line, #meta");
    if (meta && /\bwatching\b/i.test(meta.textContent)) return true;

    return false;
  }

  // ---------------------------------------------------------------------------
  // Shorts
  // ---------------------------------------------------------------------------

  function isShort(el, badgeTexts, hrefs) {
    if (el.tagName === "YTM-SHORTS-LOCKUP-VIEW-MODEL") return true;
    if (!hrefs) hrefs = getHrefs(el);
    if (hrefs.some((h) => h.startsWith("/shorts/"))) return true;
    if (!badgeTexts) badgeTexts = getBadgeTexts(el);
    if (badgeTexts.some((t) => t === "SHORTS")) return true;
    return false;
  }

  // ---------------------------------------------------------------------------
  // Mix
  // ---------------------------------------------------------------------------

  function isMix(el, badgeTexts, hrefs) {
    if (!hrefs) hrefs = getHrefs(el);
    if (hrefs.some((h) => h.includes("start_radio=1"))) return true;
    if (hrefs.some((h) => /[?&]list=RD/.test(h))) return true;
    if (!badgeTexts) badgeTexts = getBadgeTexts(el);
    if (badgeTexts.some((t) => t === "MIX")) return true;
    const title = getVideoTitle(el);
    if (/^Mix\s*[-–]/i.test(title)) return true;
    return false;
  }

  // ---------------------------------------------------------------------------
  // Playable
  // ---------------------------------------------------------------------------

  function isPlayable(el, badgeTexts, hrefs) {
    if (!hrefs) hrefs = getHrefs(el);
    if (hrefs.some((h) => h.includes("/playables/"))) return true;
    if (!badgeTexts) badgeTexts = getBadgeTexts(el);
    if (badgeTexts.some((t) => t === "PLAYABLE" || t === "PLAY GAME")) return true;
    return false;
  }

  // ---------------------------------------------------------------------------
  // Members-only
  // ---------------------------------------------------------------------------

  function isMembersOnly(el, badgeTexts) {
    if (!badgeTexts) badgeTexts = getBadgeTexts(el);
    return badgeTexts.some((t) => t === "MEMBERS ONLY");
  }

  // ---------------------------------------------------------------------------
  // View count
  // ---------------------------------------------------------------------------

  // Caps [MetaDiag] output to avoid console spam during the verification window.
  // Remove this variable and the log block below once Fix 3 is confirmed.
  let _metaDiagCount = 0;

  function isMetadataLoaded(el) {
    const tag = el.tagName;
    // Shorts elements embed their metadata inline — always ready.
    if (tag === "YTM-SHORTS-LOCKUP-VIEW-MODEL") return true;
    const meta = el.querySelector("yt-lockup-metadata-view-model, #metadata-line, #meta");
    if (tag === "YTD-VIDEO-RENDERER" && _metaDiagCount < 5) {
      _metaDiagCount++;
      YTF.log(
        "[MetaDiag]", _metaDiagCount,
        "| el:", meta ? `${meta.tagName}${meta.id ? "#" + meta.id : ""}` : "null",
        "| text:", meta ? JSON.stringify(meta.textContent.trim().slice(0, 50)) : "n/a"
      );
    }
    return meta !== null;
  }

  // Primary selectors (yt-lockup-metadata-view-model, #metadata-line, ytd-video-meta-block)
  // cover home + search. Cards without any of these are unhydrated — treated as NaN.
  // The all-spans fallback was removed: it walked every <span> per card, burning CPU,
  // and never triggered on live YouTube once the three primary selectors were in place.
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

    return NaN;
  }

  // ---------------------------------------------------------------------------
  // Duration
  // ---------------------------------------------------------------------------

  // Matches M:SS, MM:SS, H:MM:SS — status badges (LIVE, SHORTS, MIX) never match.
  const TIME_RE = /^\d{1,2}(:\d{2}){1,2}$/;

  // Returns the first badge text that matches a time pattern, or null.
  // Returns null immediately when duration filtering is off (checked by the health
  // check's durEnabled guard and by shouldHide's outer conditional, so this is safe).
  // Tests each source eagerly and returns on first match rather than collecting all
  // candidates first, so most cards exit after the badge-shape loop.
  function getDurationText(el) {
    if (!YTF.settings.hideShortDuration && !YTF.settings.hideLongDuration) return null;

    for (const b of el.querySelectorAll(YTF.SEL_BADGE)) {
      const t = (b.textContent || "").trim();
      if (TIME_RE.test(t)) return t;
    }
    for (const t of el.querySelectorAll(".yt-badge-shape__text")) {
      const txt = (t.textContent || "").trim();
      if (TIME_RE.test(txt)) return txt;
    }
    const overlay = el.querySelector(
      "thumbnail-overlay-badge-view-model, [class*='ThumbnailOverlayBadge']"
    );
    if (overlay) {
      const t = (overlay.textContent || "").trim();
      if (TIME_RE.test(t)) return t;
    }
    return null;
  }

  function isDurationLoaded(el) {
    return getDurationText(el) !== null;
  }

  // Returns total seconds, or NaN if no time-format badge is present.
  function getDuration(el) {
    const text = getDurationText(el);
    if (text === null) return NaN;
    return YTF.parseDuration(text);
  }

  // ---------------------------------------------------------------------------
  // shouldHide
  // ---------------------------------------------------------------------------

  function shouldHide(el) {
    const s = YTF.settings;

    // Compute badge texts and hrefs once per card and pass them to each detector,
    // avoiding redundant querySelectorAll calls across the five badge/href checks.
    const badgeTexts = getBadgeTexts(el);
    const hrefs = getHrefs(el);

    if (s.hideLivestreams && isLiveStream(el, badgeTexts)) {
      return { hide: true, reason: "livestream", indeterminate: false };
    }
    if (s.hideShorts && isShort(el, badgeTexts, hrefs)) {
      return { hide: true, reason: "short", indeterminate: false };
    }
    if (s.hideMixes && isMix(el, badgeTexts, hrefs)) {
      return { hide: true, reason: "mix", indeterminate: false };
    }
    if (s.hidePlayables && isPlayable(el, badgeTexts, hrefs)) {
      return { hide: true, reason: "playable", indeterminate: false };
    }
    if (s.hideMembersOnly && isMembersOnly(el, badgeTexts)) {
      return { hide: true, reason: "members-only", indeterminate: false };
    }

    // Duration check runs before the low-views deferral — duration loads with the
    // thumbnail and is available before view-count metadata arrives.
    if (s.hideShortDuration || s.hideLongDuration) {
      const durText = getDurationText(el);
      if (durText === null) {
        // No duration badge yet.  Gate on whether metadata has loaded to distinguish
        // two cases:
        //   • metadata not loaded → card is still rendering, defer (indeterminate).
        //   • metadata loaded, still no badge → channel/playlist/livestream card
        //     that legitimately has no duration; fall through so it gets stamped.
        // Without this guard, duration-less cards stay permanently unstamped and
        // the periodic rescan fires every 2 s forever, burning CPU.
        if (!isMetadataLoaded(el)) {
          return { hide: false, reason: "", indeterminate: true };
        }
        // Metadata loaded but no duration badge — fall through.
      } else {
        const secs = YTF.parseDuration(durText);
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
        // Duration present but within bounds — fall through.
      }
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
    getDurationText,
    isDurationLoaded,
    getDuration,
    shouldHide,
  });
})();
