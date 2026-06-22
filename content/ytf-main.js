"use strict";

(function () {
  const YTF = window.YTF;

  // ---------------------------------------------------------------------------
  // SPA navigation
  // ---------------------------------------------------------------------------

  // YouTube is a single-page app.  yt-navigate-finish fires after the new page
  // content has been inserted; popstate fires on browser back/forward.
  // Both need a short delay before rescanning because YouTube continues mutating
  // the DOM for several hundred ms after the event.

  function onNavigate() {
    YTF.log("Navigation — clearing marks and rescanning");
    document.querySelectorAll(`[${YTF.FILTERED_ATTR}]`).forEach((el) => {
      el.removeAttribute(YTF.FILTERED_ATTR);
      el.classList.remove("ytf-hidden");
    });
    setTimeout(() => YTF.scanAndFilter(), 500);
  }

  window.addEventListener("yt-navigate-finish", onNavigate);
  window.addEventListener("popstate", () => setTimeout(onNavigate, 300));

  // ---------------------------------------------------------------------------
  // MutationObserver (debounced)
  // ---------------------------------------------------------------------------

  // Watches the whole document body for new nodes (lazy-loaded cards, infinite
  // scroll additions).  Debounced at 250ms so rapid bursts of mutations collapse
  // into a single scan pass.
  //
  // Re-entry is safe: elements already stamped with data-ytf-filtered are skipped
  // at the top of processVideoElement, so our own class/attribute writes don't
  // cause infinite loops.
  const debouncedScan = YTF.debounce(YTF.scanAndFilter, YTF.DEBOUNCE_MS);
  const domObserver = new MutationObserver(debouncedScan);

  // ---------------------------------------------------------------------------
  // Periodic rescan
  // ---------------------------------------------------------------------------

  // Catches cards whose yt-lockup-metadata-view-model loaded between observer
  // firings.  Only runs a full scan when there are actually unresolved elements
  // to avoid unnecessary work.
  function startPeriodicRescan() {
    const unstampedSelector = YTF.VIDEO_SELECTORS.split(", ")
      .map((s) => `${s}:not([${YTF.FILTERED_ATTR}])`)
      .join(", ");

    setInterval(() => {
      if (document.querySelector(unstampedSelector)) {
        YTF.scanAndFilter();
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

      YTF.scanAndFilter();

      domObserver.observe(document.body, {
        childList: true,
        subtree: true,
      });

      startPeriodicRescan();

      YTF.log("Observer active, periodic rescan every", YTF.RESCAN_INTERVAL_MS, "ms");
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
