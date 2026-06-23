"use strict";

(function () {
  const YTF = window.YTF;

  // ---------------------------------------------------------------------------
  // MutationObserver (debounced)
  //
  // All scan paths (observer, periodic, navigation, settings-update) run through
  // safeScan, which disconnects the observer before calling scanAndFilter and
  // reconnects in a finally block.  This prevents any DOM mutations we make
  // (stamping data-ytf-filtered, adding ytf-hidden, inline style overrides) from
  // re-triggering the observer while a scan is already in progress.
  // ---------------------------------------------------------------------------

  let domObserver = null;

  function safeScan() {
    if (domObserver) domObserver.disconnect();
    try {
      YTF.scanAndFilter();
    } finally {
      if (domObserver) {
        domObserver.observe(document.body, { childList: true, subtree: true });
      }
    }
  }

  const debouncedScan = YTF.debounce(safeScan, YTF.DEBOUNCE_MS);
  domObserver = new MutationObserver(debouncedScan);

  // ---------------------------------------------------------------------------
  // SPA navigation
  // ---------------------------------------------------------------------------

  // Clear all filter marks immediately, then rescan after 500ms via safeScan.
  // Both yt-navigate-finish and popstate use the same function.
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
  // ---------------------------------------------------------------------------

  function startPeriodicRescan() {
    const unstampedSelector = YTF.VIDEO_SELECTORS.split(", ")
      .map((s) => `${s}:not([${YTF.FILTERED_ATTR}])`)
      .join(", ");

    setInterval(() => {
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

      domObserver.observe(document.body, { childList: true, subtree: true });

      safeScan();

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
