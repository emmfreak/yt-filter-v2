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

  // Clear per-card marks and restore any inline overrides we applied, then rescan.
  // Uses YTF.safeScan so the observer is disconnected during the rescan — prevents
  // the settings-update path from running a scan with the observer live.
  function resetAndRescan() {
    document.querySelectorAll(`[${FILTERED_ATTR}]`).forEach((el) => {
      if (el.dataset.ytfHeightOverride) {
        el.style.removeProperty("height");
        el.style.removeProperty("overflow");
        delete el.dataset.ytfHeightOverride;
      }
      el.removeAttribute(FILTERED_ATTR);
      el.classList.remove("ytf-hidden");
    });
    (YTF.safeScan || YTF.scanAndFilter)();
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

  // Shelf-level containers that are safe to hide for Shorts walk-up.
  // These wrap only the shelf content — NOT YouTube's outer results container.
  // ytd-item-section-renderer is intentionally excluded: hiding that whole section
  // causes YouTube to re-render it, which fires the observer and loops forever.
  const SHORTS_SHELF_TAGS = new Set([
    "YTD-REEL-SHELF-RENDERER",
    "GRID-SHELF-VIEW-MODEL",
    "YTD-RICH-SHELF-RENDERER",
    "YT-HORIZONTAL-LIST-RENDERER",
  ]);

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
    // Walk up from ytm-shorts-lockup-view-model to the nearest shelf-level
    // container in SHORTS_SHELF_TAGS — never ytd-item-section-renderer.
    // Hiding that big section container causes YouTube's results machinery to
    // re-render it, which fires the observer, which re-scans, which hides it
    // again — an infinite loop that thrashes the search page.
    //
    // Fallback: if we reach ytd-item-section-renderer without finding a shelf
    // wrapper, hide only the direct child of the section that contains the item
    // (not the whole section).
    //
    // Re-render guard: track how many times each element has been hidden via
    // dataset.ytfHideAttempts; give up after 3 to prevent any residual loops.
    if (YTF.settings.hideShorts) {
      for (const item of document.querySelectorAll("ytm-shorts-lockup-view-model")) {
        let cursor = item.parentElement;
        let shelfContainer = null;
        let sectionContainer = null;
        let depth = 0;

        while (cursor && cursor !== document.documentElement && depth < 20) {
          if (SHORTS_SHELF_TAGS.has(cursor.tagName)) {
            shelfContainer = cursor;
            break;
          }
          if (cursor.tagName === "YTD-ITEM-SECTION-RENDERER") {
            sectionContainer = cursor;
            break;
          }
          cursor = cursor.parentElement;
          depth++;
        }

        // Fallback: use the direct child of the section, not the section itself.
        if (!shelfContainer && sectionContainer) {
          let child = item;
          while (child.parentElement && child.parentElement !== sectionContainer) {
            child = child.parentElement;
          }
          if (child.parentElement === sectionContainer) {
            shelfContainer = child;
          }
        }

        if (!shelfContainer) continue;
        if (shelfContainer.hasAttribute(FILTERED_ATTR)) continue;

        // Re-render guard: stop after 3 successful hides of the same element.
        const attempts = parseInt(shelfContainer.dataset.ytfHideAttempts || "0", 10) + 1;
        shelfContainer.dataset.ytfHideAttempts = attempts;
        if (attempts > 3) {
          YTF.log("[ShortsShelf] giving up after", attempts, "attempts:", shelfContainer.tagName);
          continue;
        }

        shelfContainer.setAttribute(FILTERED_ATTR, "1");
        shelfContainer.classList.add("ytf-hidden");
        YTF.log("[ShortsShelf] hiding:", shelfContainer.tagName, shelfContainer.id || "");
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
  // Topic chips bar
  //
  // The empty rectangle below the search bar is div#frosted-glass — a standalone
  // frosted overlay, NOT inside ytd-rich-grid-renderer or ytd-masthead.
  // When the chip bar is visible, YouTube sets its height to 112px
  // (56px masthead + 56px chip reservation).
  //
  // Prior approaches that failed:
  //   - Removing the "with-chipbar" class → loses the frosted background entirely.
  //   - display:none → same: sticky header loses its background on scroll.
  //   - ytd-masthead[frosted-glass-mode] attribute mutation → YouTube reverts it,
  //     causing a MutationObserver tug-of-war that thrashed the search page.
  //
  // Correct fix: inline height override to 56px, leaving with-chipbar intact so
  // the frosted background remains.  Restore is handled in resetAndRescan().
  // ---------------------------------------------------------------------------

  function filterTopicChips() {
    if (!YTF.settings.hideTopicChips) return;

    const frostedGlass = document.querySelector("div#frosted-glass");
    YTF.log("[FrostDiag] div#frosted-glass:", frostedGlass ? "FOUND" : "NOT FOUND");

    if (frostedGlass) {
      const heightBefore = getComputedStyle(frostedGlass).height;
      YTF.log("[FrostDiag] height before override:", heightBefore);

      if (!frostedGlass.hasAttribute(FILTERED_ATTR)) {
        frostedGlass.style.setProperty("height", "56px", "important");
        frostedGlass.style.setProperty("overflow", "hidden");
        frostedGlass.setAttribute(FILTERED_ATTR, "1");
        frostedGlass.dataset.ytfHeightOverride = "1";

        const heightAfter = getComputedStyle(frostedGlass).height;
        YTF.log("[FrostDiag] height after override:", heightAfter);
      }
    }

    // Hide the chip bar row and its containing #header so the layout gap collapses.
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
