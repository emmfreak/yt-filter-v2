"use strict";

(function () {
  const YTF = window.YTF;
  const FILTERED_ATTR = YTF.FILTERED_ATTR;

  // ---------------------------------------------------------------------------
  // Individual card processing
  // ---------------------------------------------------------------------------

  function processVideoElement(el) {
    if (el.hasAttribute(FILTERED_ATTR)) return true;

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

    if (indeterminate) return false;

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

  // Clear per-card marks + body-level state, then rescan.
  function resetAndRescan() {
    document.body.classList.remove("ytf-chips-hidden");
    document.querySelectorAll(`[${FILTERED_ATTR}]`).forEach((el) => {
      el.removeAttribute(FILTERED_ATTR);
      el.classList.remove("ytf-hidden");
    });
    scanAndFilter();
  }

  // ---------------------------------------------------------------------------
  // Shelf / section filtering
  // ---------------------------------------------------------------------------

  const SHELF_FILTERS = [
    { pattern: /\bplayable/i,         settingKey: "hidePlayables",     reason: "playables shelf"      },
    { pattern: /\bshorts\b/i,         settingKey: "hideShorts",        reason: "shorts shelf"         },
    { pattern: /\bexplore\b.*topic/i, settingKey: "hideExploreTopics", reason: "explore topics shelf" },
    { pattern: /\btopic.*explore\b/i, settingKey: "hideExploreTopics", reason: "explore topics shelf" },
  ];

  const SHELF_SELECTORS = [
    "ytd-rich-shelf-renderer",
    "ytd-reel-shelf-renderer",
    "ytd-rich-section-renderer",
    "ytd-shelf-renderer",
    "grid-shelf-view-model",
  ].join(", ");

  function scanAndFilterShelves() {
    // 1. Heading-based hiding for Playables, Explore Topics, etc.
    const shelves = document.querySelectorAll(SHELF_SELECTORS);
    for (const shelf of shelves) {
      if (shelf.hasAttribute(FILTERED_ATTR)) continue;

      const heading = shelf.querySelector(
        "#title, #title-text, h2, yt-dynamic-text-view-model, yt-section-header-view-model"
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

    // 2. Shorts shelf walk-up
    //
    // Items are stamped "1" by the per-card scan before this runs, so we gate
    // on the SHELF CONTAINER stamp, not the item stamp.  Walk up to
    // ytd-item-section-renderer (the search-results section wrapper that holds
    // both the shelf heading and the item grid).
    if (YTF.settings.hideShorts) {
      for (const item of document.querySelectorAll("ytm-shorts-lockup-view-model")) {
        let cursor = item.parentElement;
        let shelfContainer = null;
        let depth = 0;

        while (cursor && cursor !== document.documentElement && depth < 20) {
          if (cursor.tagName === "YTD-ITEM-SECTION-RENDERER") {
            shelfContainer = cursor;
            break;
          }
          cursor = cursor.parentElement;
          depth++;
        }

        if (!shelfContainer) continue;
        if (shelfContainer.hasAttribute(FILTERED_ATTR)) continue;

        shelfContainer.setAttribute(FILTERED_ATTR, "1");
        shelfContainer.classList.add("ytf-hidden");
        YTF.log("Hidden Shorts section:", shelfContainer.tagName, shelfContainer.id || "");
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Shorts guide entry
  // ---------------------------------------------------------------------------

  function filterShortsNav() {
    if (!YTF.settings.hideShorts) return;

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
  // Topic chips bar — CSS-only collapse via body class
  //
  // Earlier versions mutated ytd-masthead[frosted-glass-mode] and #background
  // height directly.  YouTube's framework reverts those attribute writes, and
  // the resulting DOM churn re-triggers our MutationObserver — an attribute
  // tug-of-war that caused the search page to reload constantly.
  //
  // Replacement: toggle a class on document.body (our element, no YT fight).
  // styles.css uses that class to collapse the chip row and the 112px masthead
  // background reservation.  No YouTube-owned attributes are mutated.
  // ---------------------------------------------------------------------------

  function filterTopicChips() {
    if (!YTF.settings.hideTopicChips) return;
    if (document.body.classList.contains("ytf-chips-hidden")) return;
    document.body.classList.add("ytf-chips-hidden");
    YTF.log("Topic chips: body.ytf-chips-hidden applied (CSS collapses bar + masthead bg)");
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
