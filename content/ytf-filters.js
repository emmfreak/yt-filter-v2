"use strict";

(function () {
  const YTF = window.YTF;
  const FILTERED_ATTR = YTF.FILTERED_ATTR;

  // ---------------------------------------------------------------------------
  // Fix 2 — Masthead frosted-glass fix (reversible)
  //
  // When the homepage chip bar is visible, ytd-masthead carries
  // frosted-glass-mode="with-chipbar", which makes its #background element
  // 112px tall (56px bar + 56px chip-bar reservation).  Hiding the chip bar
  // renderer doesn't change that attribute, so a 56px frosted rectangle stays
  // behind.  We set the attribute to "none" and — as a fallback — pin the
  // #background height to 56px.  Both changes are reversed by restoreMastheadFix()
  // before every resetAndRescan so they don't linger when the setting is toggled.
  // ---------------------------------------------------------------------------

  let mastheadFixApplied = false;

  function applyMastheadFix() {
    if (mastheadFixApplied) return;
    const masthead = document.querySelector("ytd-masthead");
    if (!masthead) return;

    const current = masthead.getAttribute("frosted-glass-mode");
    if (current !== "with-chipbar") return; // Only "with-chipbar" reserves the extra space

    masthead.dataset.ytfFrostedOrig = current;
    masthead.setAttribute("frosted-glass-mode", "none");
    mastheadFixApplied = true;
    YTF.log("[Fix2] frosted-glass-mode: with-chipbar → none");

    // Fallback: if the attribute change alone doesn't collapse the space, force the height.
    const bg = masthead.querySelector("#background");
    if (bg) {
      bg.dataset.ytfHeightOrig = bg.style.height;
      bg.style.setProperty("height", "56px", "important");
      YTF.log("[Fix2] masthead #background computed height after fix:", getComputedStyle(bg).height);
    }
  }

  function restoreMastheadFix() {
    if (!mastheadFixApplied) return;
    mastheadFixApplied = false;

    const masthead = document.querySelector("ytd-masthead");
    if (!masthead) return;

    const orig = masthead.dataset.ytfFrostedOrig;
    if (orig !== undefined) {
      masthead.setAttribute("frosted-glass-mode", orig);
      delete masthead.dataset.ytfFrostedOrig;
    }

    const bg = masthead.querySelector("#background");
    if (bg && bg.dataset.ytfHeightOrig !== undefined) {
      const origH = bg.dataset.ytfHeightOrig;
      if (origH) {
        bg.style.height = origH;
      } else {
        bg.style.removeProperty("height");
      }
      delete bg.dataset.ytfHeightOrig;
    }

    YTF.log("[Fix2] Restored masthead frosted-glass-mode to:", orig || "(attribute removed)");
  }

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

  // Restore any shared-element mutations first, then clear per-card marks and rescan.
  function resetAndRescan() {
    restoreMastheadFix();
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

    // 2. Shorts shelf walk-up  (Fix 1 — revised)
    //
    // The per-card scan stamps ytm-shorts-lockup-view-model items with "1" before
    // this function runs, so gating on the *item* stamp causes the entire walk-up
    // to be skipped.  We gate on the *shelf container* stamp instead.
    //
    // Strategy: walk up from each Shorts item to ytd-item-section-renderer, which
    // is the section wrapper in YouTube search results and contains both the shelf
    // heading and the item grid.  Log the ancestor chain on every newly-found
    // (unstamped) container so the live structure is visible in the console.
    if (YTF.settings.hideShorts) {
      for (const item of document.querySelectorAll("ytm-shorts-lockup-view-model")) {
        let cursor = item.parentElement;
        const chain = [];
        let shelfContainer = null;
        let depth = 0;

        while (cursor && cursor !== document.documentElement && depth < 20) {
          const id  = cursor.id ? `#${cursor.id}` : "";
          const cls = cursor.classList.length
            ? `.${[...cursor.classList].slice(0, 3).join(".")}`
            : "";
          chain.push(`${cursor.tagName}${id}${cls}`);

          if (cursor.tagName === "YTD-ITEM-SECTION-RENDERER") {
            shelfContainer = cursor;
            break;
          }
          cursor = cursor.parentElement;
          depth++;
        }

        if (!shelfContainer) continue;
        if (shelfContainer.hasAttribute(FILTERED_ATTR)) continue; // Already hidden

        YTF.log("[Fix1] Shorts walk-up chain:", chain.join(" > "));
        shelfContainer.setAttribute(FILTERED_ATTR, "1");
        shelfContainer.classList.add("ytf-hidden");
        YTF.log("[Fix1] Hidden Shorts section:", shelfContainer.tagName, shelfContainer.id || "");
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
  // Topic chips bar  (Fix 2)
  // ---------------------------------------------------------------------------

  function filterTopicChips() {
    if (!YTF.settings.hideTopicChips) return;

    const chipBars = document.querySelectorAll("ytd-feed-filter-chip-bar-renderer");
    for (const bar of chipBars) {
      if (bar.hasAttribute(FILTERED_ATTR)) continue;
      bar.setAttribute(FILTERED_ATTR, "1");
      bar.classList.add("ytf-hidden");

      // Hide the #header parent to close the 56px gap it holds.
      const header = bar.parentElement;
      if (header && header.id === "header" && !header.hasAttribute(FILTERED_ATTR)) {
        header.setAttribute(FILTERED_ATTR, "1");
        header.classList.add("ytf-hidden");
      }

      YTF.log("Hiding topic chips bar");
    }

    // Collapse the masthead frosted-glass background that reserves space for the chip bar.
    applyMastheadFix();
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
