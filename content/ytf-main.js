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
  // ---------------------------------------------------------------------------

  const debouncedScan = YTF.debounce(YTF.scanAndFilter, YTF.DEBOUNCE_MS);
  const domObserver = new MutationObserver(debouncedScan);

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
