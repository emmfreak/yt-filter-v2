"use strict";

(function () {
  const YTF = window.YTF;

  // ---------------------------------------------------------------------------
  // SPA navigation  (Fix 3: single 500ms delay for both event paths)
  // ---------------------------------------------------------------------------

  // Clear all filter marks immediately, then rescan after 500ms.
  // Both yt-navigate-finish and popstate use the same function — no extra
  // outer wrapper that was doubling the delay on back/forward navigation.
  function clearAndScheduleRescan() {
    document.querySelectorAll(`[${YTF.FILTERED_ATTR}]`).forEach((el) => {
      el.removeAttribute(YTF.FILTERED_ATTR);
      el.classList.remove("ytf-hidden");
    });
    setTimeout(() => YTF.scanAndFilter(), 500);
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
  // MutationObserver (debounced)
  //
  // Safety net: disconnect the observer for the duration of the scan so any
  // DOM mutations we cause (adding ytf-hidden classes, setting data-ytf-filtered,
  // toggling body.ytf-chips-hidden) can't feed back into the observer and trigger
  // another scan.  Re-attach after.  Without this guard, an attribute write that
  // YouTube reverts can spin into an infinite re-scan loop.
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
  // Periodic rescan
  // ---------------------------------------------------------------------------

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

      domObserver.observe(document.body, { childList: true, subtree: true });

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
