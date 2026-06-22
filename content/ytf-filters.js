"use strict";

(function () {
  const YTF = window.YTF;
  const FILTERED_ATTR = YTF.FILTERED_ATTR;

  // ---------------------------------------------------------------------------
  // Individual card processing
  // ---------------------------------------------------------------------------

  function processVideoElement(el) {
    if (el.hasAttribute(FILTERED_ATTR)) return true;

    // A yt-lockup-view-model nested inside ytd-rich-item-renderer or ytd-video-renderer
    // is handled by its parent — skip it to avoid double-processing.
    if (
      el.tagName === "YT-LOCKUP-VIEW-MODEL" &&
      el.closest(YTF.YTD_CONTAINER_SELECTORS)
    ) {
      el.setAttribute(FILTERED_ATTR, "skip");
      return true;
    }

    const { hide, reason, indeterminate } = YTF.shouldHide(el);

    if (hide) {
      el.setAttribute(FILTERED_ATTR, "1");
      el.classList.add("ytf-hidden");
      YTF.log("Hiding:", YTF.getVideoTitle(el), "—", reason);
      return true;
    }

    if (indeterminate) {
      // Metadata not yet loaded — leave unset so the periodic rescan retries.
      return false;
    }

    el.setAttribute(FILTERED_ATTR, "pass");
    return true;
  }

  // ---------------------------------------------------------------------------
  // Main scan
  // ---------------------------------------------------------------------------

  function scanAndFilter() {
    const elements = document.querySelectorAll(YTF.VIDEO_SELECTORS);
    let newCount = 0;
    let resolvedCount = 0;

    for (const el of elements) {
      const status = el.getAttribute(FILTERED_ATTR);
      if (status === "1" || status === "pass" || status === "skip") continue;
      newCount++;
      if (processVideoElement(el)) resolvedCount++;
    }

    if (newCount > 0) {
      YTF.log(`Scanned ${newCount} unresolved, resolved ${resolvedCount}`);
    }

    scanAndFilterShelves();
    filterShortsNav();
    filterTopicChips();
  }

  // Clear all filter marks and re-run — called on settings change.
  function resetAndRescan() {
    document.querySelectorAll(`[${FILTERED_ATTR}]`).forEach((el) => {
      el.removeAttribute(FILTERED_ATTR);
      el.classList.remove("ytf-hidden");
    });
    scanAndFilter();
  }

  // ---------------------------------------------------------------------------
  // Shelf / section filtering
  // ---------------------------------------------------------------------------

  // Shelf heading text → which setting governs it.
  const SHELF_FILTERS = [
    { pattern: /\bplayable/i,         settingKey: "hidePlayables",     reason: "playables shelf"       },
    { pattern: /\bshorts\b/i,         settingKey: "hideShorts",        reason: "shorts shelf"          },
    { pattern: /\bexplore\b.*topic/i, settingKey: "hideExploreTopics", reason: "explore topics shelf"  },
    { pattern: /\btopic.*explore\b/i, settingKey: "hideExploreTopics", reason: "explore topics shelf"  },
  ];

  // Shelf container selectors:
  //   ytd-rich-shelf-renderer / ytd-reel-shelf-renderer / ytd-shelf-renderer
  //     — classic shelf types confirmed in old code; kept as they still appear in practice.
  //   ytd-rich-section-renderer
  //     — wraps shelves on the homepage rich grid.
  //   grid-shelf-view-model
  //     — confirmed in search custom elements list; used for Shorts grid in search results.
  const SHELF_SELECTORS = [
    "ytd-rich-shelf-renderer",
    "ytd-reel-shelf-renderer",
    "ytd-rich-section-renderer",
    "ytd-shelf-renderer",
    "grid-shelf-view-model",
  ].join(", ");

  function scanAndFilterShelves() {
    // 1. Heading-based: find a shelf, read its heading, hide if it matches a pattern.
    const shelves = document.querySelectorAll(SHELF_SELECTORS);
    for (const shelf of shelves) {
      if (shelf.hasAttribute(FILTERED_ATTR)) continue;

      // Heading element candidates.  yt-section-header-view-model confirmed in
      // search custom elements list; others are classic YouTube shelf headers.
      const heading = shelf.querySelector(
        "#title, #title-text, h2, " +
        "yt-dynamic-text-view-model, " +
        "yt-section-header-view-model"
      );
      const headingText = heading ? heading.textContent.trim() : "";

      let matched = false;
      if (headingText) {
        for (const f of SHELF_FILTERS) {
          if (!YTF.settings[f.settingKey]) continue;
          if (f.pattern.test(headingText)) {
            shelf.setAttribute(FILTERED_ATTR, "1");
            shelf.classList.add("ytf-hidden");
            YTF.log("Hiding shelf:", headingText, "—", f.reason);
            matched = true;
            break;
          }
        }
      }
      if (!matched) shelf.setAttribute(FILTERED_ATTR, "pass");
    }

    // 2. Shorts walk-up: for each unprocessed ytm-shorts-lockup-view-model, climb
    //    the tree to find its enclosing shelf container and hide the whole block.
    //    This catches the Shorts grid in search results even when heading detection
    //    fails (e.g. heading not yet loaded or in a shadow root).
    //    Source: ytm-shorts-lockup-view-model confirmed in search capture (15 found);
    //            grid-shelf-view-model confirmed in search custom elements list.
    if (YTF.settings.hideShorts) {
      const shortsItems = document.querySelectorAll("ytm-shorts-lockup-view-model");
      for (const item of shortsItems) {
        if (item.hasAttribute(FILTERED_ATTR)) continue;

        const shelf = item.closest(
          "grid-shelf-view-model, ytd-reel-shelf-renderer, " +
          "ytd-rich-section-renderer, ytd-item-section-renderer"
        );
        if (shelf && !shelf.hasAttribute(FILTERED_ATTR)) {
          shelf.setAttribute(FILTERED_ATTR, "1");
          shelf.classList.add("ytf-hidden");
          YTF.log("Hiding Shorts shelf (walk-up from ytm-shorts-lockup-view-model)");
        }
        // Stamp the item too so it doesn't trigger another walk-up on the next scan.
        item.setAttribute(FILTERED_ATTR, "1");
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Shorts guide entry
  // ---------------------------------------------------------------------------

  function filterShortsNav() {
    if (!YTF.settings.hideShorts) return;

    // ytd-guide-entry-renderer confirmed in home and watch captures.
    // Find the entry whose link href is exactly "/shorts".
    const entries = document.querySelectorAll(
      "ytd-guide-entry-renderer, ytd-mini-guide-entry-renderer"
    );
    for (const entry of entries) {
      if (entry.hasAttribute(FILTERED_ATTR)) continue;
      const link = entry.querySelector("a[href]");
      if (link && /^\/shorts\b/.test(link.getAttribute("href") || "")) {
        entry.setAttribute(FILTERED_ATTR, "1");
        entry.classList.add("ytf-hidden");
        YTF.log("Hiding guide: Shorts nav entry");
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Topic chips bar
  // ---------------------------------------------------------------------------

  function filterTopicChips() {
    if (!YTF.settings.hideTopicChips) return;

    // ytd-feed-filter-chip-bar-renderer confirmed in all three captures.
    // Hierarchy: ytd-rich-grid-renderer > div#header > ytd-feed-filter-chip-bar-renderer
    //
    // Hiding only the chip bar renderer leaves an empty gap because div#header
    // has its own height/padding.  We also hide the #header parent when it is
    // the direct parent (parentElement.id === "header"), which it always is per
    // the captures.
    const chipBars = document.querySelectorAll("ytd-feed-filter-chip-bar-renderer");
    for (const bar of chipBars) {
      if (bar.hasAttribute(FILTERED_ATTR)) continue;
      bar.setAttribute(FILTERED_ATTR, "1");
      bar.classList.add("ytf-hidden");

      const header = bar.parentElement;
      if (header && header.id === "header" && !header.hasAttribute(FILTERED_ATTR)) {
        header.setAttribute(FILTERED_ATTR, "1");
        header.classList.add("ytf-hidden");
      }

      YTF.log("Hiding topic chips bar");
    }
  }

  // ---------------------------------------------------------------------------
  // Exports
  // ---------------------------------------------------------------------------

  Object.assign(window.YTF, {
    processVideoElement,
    scanAndFilter,
    resetAndRescan,
    scanAndFilterShelves,
    filterShortsNav,
    filterTopicChips,
  });
})();
