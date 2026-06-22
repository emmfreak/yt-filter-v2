"use strict";

(function () {
  const YTF = window.YTF;

  // ---------------------------------------------------------------------------
  // Shared helpers
  // ---------------------------------------------------------------------------

  // Collect all badge text strings from a card.
  // Source: badge-shape confirmed in all three reference captures; duration ("26:54")
  // also uses this element, so callers must do exact-match checks, not substring.
  function getBadgeTexts(el) {
    const nodes = el.querySelectorAll("badge-shape .yt-badge-shape__text");
    return Array.from(nodes).map((n) => (n.textContent || "").trim().toUpperCase());
  }

  // Collect all href attribute values (raw strings, not resolved URLs) from
  // anchor descendants.  Using getAttribute avoids browser URL resolution so
  // relative paths like "/shorts/ID" stay as-is.
  function getHrefs(el) {
    const anchors = el.querySelectorAll("a[href]");
    return Array.from(anchors).map((a) => a.getAttribute("href") || "");
  }

  // Get a card's title for logging and Mix-title detection.
  // Sources:
  //   yt-lockup-metadata-view-model h3 — lockup card anatomy in all three captures
  //   h3.shortsLockupViewModelHostMetadataTitle — ytm-shorts-lockup-view-model anatomy, search capture
  //   #video-title — ytd-video-renderer search results
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
  // Livestream detector
  // ---------------------------------------------------------------------------

  function isLiveStream(el) {
    // Primary: badge text "LIVE" or "LIVE NOW".
    // badge-shape .yt-badge-shape__text confirmed in all three captures; thumbnail
    // badges render before metadata so this check is reliable at first scan.
    const badges = getBadgeTexts(el);
    if (badges.some((t) => t === "LIVE" || t === "LIVE NOW")) return true;

    // Search results also use ytd-thumbnail-overlay-time-status-renderer.
    // Confirmed present in search custom elements list; not present on home/watch.
    const overlays = el.querySelectorAll(
      "ytd-thumbnail-overlay-time-status-renderer"
    );
    for (const o of overlays) {
      if ((o.getAttribute("overlay-style") || "").toUpperCase() === "LIVE") return true;
      const txt = (o.textContent || "").trim().toUpperCase();
      if (txt === "LIVE" || txt === "LIVE NOW") return true;
    }

    // "X watching" in metadata — only present once yt-lockup-metadata-view-model loads.
    // Source: livestreams on the lockup card show "X watching" instead of view count.
    const meta = el.querySelector(
      "yt-lockup-metadata-view-model, #metadata-line, #meta"
    );
    if (meta && /\bwatching\b/i.test(meta.textContent)) return true;

    return false;
  }

  // ---------------------------------------------------------------------------
  // Shorts detector
  // ---------------------------------------------------------------------------

  function isShort(el) {
    // ytm-shorts-lockup-view-model is exclusively used for Shorts.
    // Confirmed in search capture (15 found); tag name is definitive.
    if (el.tagName === "YTM-SHORTS-LOCKUP-VIEW-MODEL") return true;

    // Any link with href starting "/shorts/".
    // Source: ytm-shorts-lockup-view-model card anatomy — a.shortsLockupViewModelHostEndpoint[href="/shorts/ID"]
    // Also applies to lockup cards linking to Shorts.
    if (getHrefs(el).some((h) => h.startsWith("/shorts/"))) return true;

    // Badge text "SHORTS".
    if (getBadgeTexts(el).some((t) => t === "SHORTS")) return true;

    // Search thumbnail overlay (ytd-thumbnail-overlay-time-status-renderer).
    const overlays = el.querySelectorAll(
      "ytd-thumbnail-overlay-time-status-renderer"
    );
    for (const o of overlays) {
      if ((o.getAttribute("overlay-style") || "").toUpperCase() === "SHORTS") return true;
    }

    return false;
  }

  // ---------------------------------------------------------------------------
  // Mix detector
  // ---------------------------------------------------------------------------

  function isMix(el) {
    // Mix URLs always carry start_radio=1 or list=RD… in the query string.
    // This check works on the raw relative href so it fires before metadata loads.
    const hrefs = getHrefs(el);
    if (hrefs.some((h) => h.includes("start_radio=1"))) return true;
    if (hrefs.some((h) => /[?&]list=RD/.test(h))) return true;

    // Badge text "MIX".
    if (getBadgeTexts(el).some((t) => t === "MIX")) return true;

    // Title starting with "Mix -" or "Mix –".
    // Only fires once yt-lockup-metadata-view-model h3 has loaded; the URL
    // check above should already catch any URL-bearing mix by this point.
    const title = getVideoTitle(el);
    if (/^Mix\s*[-–]/i.test(title)) return true;

    return false;
  }

  // ---------------------------------------------------------------------------
  // Playable detector
  // ---------------------------------------------------------------------------

  function isPlayable(el) {
    // Playables always link to /playables/.
    if (getHrefs(el).some((h) => h.includes("/playables/"))) return true;

    // Badge text "PLAYABLE" or "PLAY GAME".
    if (getBadgeTexts(el).some((t) => t === "PLAYABLE" || t === "PLAY GAME")) return true;

    return false;
  }

  // ---------------------------------------------------------------------------
  // Members-only detector
  // ---------------------------------------------------------------------------

  function isMembersOnly(el) {
    // Sole signal is the badge text. No reliable URL pattern.
    return getBadgeTexts(el).some((t) => t === "MEMBERS ONLY");
  }

  // ---------------------------------------------------------------------------
  // View count
  // ---------------------------------------------------------------------------

  // Check whether a card's metadata has loaded — determines whether a missing
  // view count means "still loading" (indeterminate) vs. "no views field" (pass).
  //
  // For lockup cards (ytd-rich-item-renderer, yt-lockup-view-model):
  //   yt-lockup-metadata-view-model is a lazy-rendered child.  If absent the card
  //   hasn't finished hydrating; we defer rather than hide or pass.
  //   Source: card anatomy in all three captures shows it as a leaf inside
  //   div.ytLockupViewModelMetadata.
  //
  // For search rows (ytd-video-renderer):
  //   Metadata renders synchronously with the element — always consider loaded.
  //
  // For Shorts (ytm-shorts-lockup-view-model):
  //   No view count field — always loaded (Shorts are caught by isShort before we
  //   ever reach the view-count check in shouldHide).
  function isMetadataLoaded(el) {
    const tag = el.tagName;
    if (tag === "YTD-VIDEO-RENDERER" || tag === "YTM-SHORTS-LOCKUP-VIEW-MODEL") {
      return true;
    }
    return el.querySelector("yt-lockup-metadata-view-model") !== null;
  }

  // Extract view count from a card element. Returns NaN when not found.
  // NaN after isMetadataLoaded === true means no view count in the metadata
  // (e.g. a channel or playlist card) — caller should pass, not defer.
  function getViewCount(el) {
    const { extractViewString, parseViewCount } = YTF;

    // Lockup cards: yt-lockup-metadata-view-model contains "X views" as text.
    // Source: card anatomy — metadata lives in yt-lockup-metadata-view-model
    //         (home capture lines 371-374, watch capture lines 427-430).
    const lockupMeta = el.querySelector("yt-lockup-metadata-view-model");
    if (lockupMeta) {
      const vs = extractViewString(lockupMeta.textContent);
      if (vs) return parseViewCount(vs);
    }

    // Search rows: metadata is in #metadata-line or ytd-video-meta-block.
    // Source: ytd-video-renderer anatomy in search capture; ytd-video-meta-block
    //         confirmed in search custom elements list.
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

    // Broad span scan — last resort.
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
  // shouldHide — the main filtering decision
  // ---------------------------------------------------------------------------

  // Returns { hide: boolean, reason: string, indeterminate: boolean }.
  //
  // Detectors run in order: livestream → shorts → mixes → playables →
  // members-only → low-views.  All checks except low-views work before
  // metadata loads (they use badges or URL patterns).
  // Low-views defers if metadata isn't loaded yet (indeterminate: true).
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
        // Metadata not hydrated yet — defer, do not hide, do not pass.
        return { hide: false, reason: "", indeterminate: true };
      }
      const views = getViewCount(el);
      if (isNaN(views)) {
        // Metadata present but no view count field (channel/playlist card) — pass.
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
    shouldHide,
  });
})();
