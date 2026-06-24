"use strict";

(function () {
  const YTF = window.YTF;

  // ---------------------------------------------------------------------------
  // Scoped observer target
  //
  // Observe the narrowest container that still contains all filterable content
  // for the current page type.  This prevents player/comment/hover-preview
  // mutations from triggering scans — the main source of CPU churn on
  // document.body.
  //
  // getObserveTarget() is called in safeScan's finally block so the target
  // self-heals after navigation: if the container doesn't exist on the first
  // post-nav scan (page still loading), the fallback is used and the next
  // observer-triggered scan picks up the real container once it appears.
  // ---------------------------------------------------------------------------

  function getObserveTarget() {
    const p = location.pathname;

    if (p === "/" || p.startsWith("/feed/")) {
      // Home — the grid's inner #contents is where ytd-rich-item-renderer
      // elements are inserted; this excludes masthead/sidebar mutations.
      return (
        document.querySelector(`${YTF.SEL_RICH_GRID} #contents`) ||
        document.querySelector(YTF.SEL_RICH_GRID) ||
        document.querySelector("#page-manager") ||
        document.body
      );
    }

    if (p.startsWith("/results")) {
      // Search — ytd-section-list-renderer holds all result rows.
      return (
        document.querySelector("ytd-section-list-renderer") ||
        document.querySelector("#page-manager") ||
        document.body
      );
    }

    if (p.startsWith("/watch")) {
      // Watch page — observe only the sidebar items list, not the player.
      return (
        document.querySelector(`${YTF.SEL_SECONDARY} #items`) ||
        document.querySelector(YTF.SEL_SECONDARY) ||
        document.querySelector("#page-manager") ||
        document.body
      );
    }

    // All other pages (channel, playlist, settings, …) — #page-manager is far
    // narrower than body and still covers any feed-like content that might load.
    return document.querySelector("#page-manager") || document.body;
  }

  // ---------------------------------------------------------------------------
  // MutationObserver (debounced)
  //
  // All scan paths run through safeScan, which disconnects the observer before
  // calling scanAndFilter and reconnects in a finally block.  The reconnect
  // calls getObserveTarget() so the scope is updated after each navigation.
  // ---------------------------------------------------------------------------

  let domObserver = null;

  function safeScan() {
    if (domObserver) domObserver.disconnect();
    try {
      YTF.scanAndFilter();
    } finally {
      if (domObserver) {
        domObserver.observe(getObserveTarget(), { childList: true, subtree: true });
      }
    }
  }

  const debouncedScan = YTF.debounce(safeScan, YTF.DEBOUNCE_MS);
  domObserver = new MutationObserver(debouncedScan);

  // ---------------------------------------------------------------------------
  // SPA navigation
  // ---------------------------------------------------------------------------

  function clearAndScheduleRescan() {
    document.querySelectorAll(`[${YTF.FILTERED_ATTR}]`).forEach((el) => {
      if (el.dataset.ytfHeightOverride) {
        el.style.removeProperty("height");
        el.style.removeProperty("overflow");
        delete el.dataset.ytfHeightOverride;
      }
      el.removeAttribute(YTF.FILTERED_ATTR);
      el.classList.remove("ytf-hidden");
    });
    setTimeout(safeScan, 500);
  }

  window.addEventListener("yt-navigate-finish", () => {
    YTF.log("yt-navigate-finish — rescanning");
    clearAndScheduleRescan();
  });

  window.addEventListener("popstate", () => {
    YTF.log("popstate — rescanning");
    clearAndScheduleRescan();
  });

  // ---------------------------------------------------------------------------
  // Periodic rescan
  //
  // Safety net for late-hydrating cards that the observer might miss.
  // Only runs on pages that actually have a filterable feed; other pages
  // (channels, settings, …) produce no filterable content and should not
  // pay the repeated querySelector cost.
  // ---------------------------------------------------------------------------

  function startPeriodicRescan() {
    const unstampedSelector = YTF.VIDEO_SELECTORS.split(", ")
      .map((s) => `${s}:not([${YTF.FILTERED_ATTR}])`)
      .join(", ");

    setInterval(() => {
      const p = location.pathname;
      const hasFeed =
        p === "/" ||
        p.startsWith("/feed/") ||
        p.startsWith("/results") ||
        p.startsWith("/watch");
      if (!hasFeed) return;

      if (document.querySelector(unstampedSelector)) {
        safeScan();
      }
    }, YTF.RESCAN_INTERVAL_MS);
  }

  // ---------------------------------------------------------------------------
  // Init
  // ---------------------------------------------------------------------------

  function init() {
    YTF.loadSettings().then(() => {
      YTF.log(
        "YouTube Feed Filter v2 ready (threshold:",
        YTF.settings.viewThreshold,
        "views)"
      );

      // Export safeScan before first scan so resetAndRescan in filters.js can
      // use it for the settings-update path.
      Object.assign(window.YTF, { safeScan });

      domObserver.observe(getObserveTarget(), { childList: true, subtree: true });

      safeScan();

      startPeriodicRescan();

      YTF.log("Observer active on", getObserveTarget().tagName || getObserveTarget().id,
        "— periodic rescan every", YTF.RESCAN_INTERVAL_MS, "ms");
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
