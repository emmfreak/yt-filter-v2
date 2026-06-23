"use strict";

(function () {
  const YTF = window.YTF;

  // ---------------------------------------------------------------------------
  // Page type
  // ---------------------------------------------------------------------------

  function getPageType() {
    const p = location.pathname;
    if (p === "/" || p.startsWith("/feed/")) return "home";
    if (p.startsWith("/watch")) return "watch";
    if (p.startsWith("/results")) return "search";
    return "other";
  }

  // ---------------------------------------------------------------------------
  // Canary checks
  //
  // Every test() references a YTF.SEL_* constant, so the canary and the scanner
  // share exactly one selector string per element type.  Updating a constant in
  // ytf-constants.js updates both the scanner and the canary that guards it.
  //
  // guard(): page has enough content rendered that this check is meaningful.
  //          Skipping when the guard fails prevents false positives on pages that
  //          genuinely don't have the feature (e.g. /watch has no grid).
  //          Guards form a chain per page type: each check guards the next, so a
  //          missing outer container suppresses checks for its inner elements
  //          rather than cascading into spurious failures.
  // test():  the specific selector/condition under surveillance.
  // pages:   page types this applies to, or ["any"] for all pages.
  // ---------------------------------------------------------------------------

  const CANARY_CHECKS = [
    // — Home ——————————————————————————————————————————————————————————————————
    {
      name: "Rich grid renderer",
      pages: ["home"],
      // ytd-browse is the stable page container; always present once the SPA
      // has navigated to the home page, even before the grid fills in.
      guard: () => document.querySelector("ytd-browse") !== null,
      test:  () => document.querySelector(YTF.SEL_RICH_GRID) !== null,
    },
    {
      name: "Homepage card anchor",
      pages: ["home"],
      guard: () => document.querySelector(YTF.SEL_RICH_GRID) !== null,
      test:  () => document.querySelectorAll(YTF.SEL_RICH_ITEM).length > 0,
    },
    {
      name: "Frosted-glass header",
      pages: ["home"],
      // The frosted-glass element only makes sense when cards are present;
      // without SEL_RICH_ITEM this check would always fail on empty homepages.
      guard: () => document.querySelectorAll(YTF.SEL_RICH_ITEM).length > 0,
      test:  () => document.querySelector(YTF.SEL_FROSTED_GLASS) !== null,
    },

    // — Search ————————————————————————————————————————————————————————————————
    {
      name: "Video renderer",
      pages: ["search"],
      // Guard on the section container rather than the renderer itself —
      // the renderer count could legitimately be 0 if all results were hidden.
      guard: () => document.querySelector("ytd-item-section-renderer") !== null,
      test:  () => document.querySelectorAll(YTF.SEL_VIDEO_RENDERER).length > 0,
    },

    // — Watch ——————————————————————————————————————————————————————————————————
    {
      name: "Watch sidebar container",
      pages: ["watch"],
      guard: () => document.querySelector("ytd-watch-flexy, #player") !== null,
      test:  () => document.querySelector(YTF.SEL_SECONDARY) !== null,
    },
    {
      name: "Watch sidebar lockups",
      pages: ["watch"],
      // SEL_LOCKUP is the watch-sidebar card element; guard with SEL_SECONDARY
      // so we only assert it once the sidebar container exists.
      guard: () => document.querySelector(YTF.SEL_SECONDARY) !== null,
      test:  () => document.querySelectorAll(YTF.SEL_LOCKUP).length > 0,
    },

    // — Any page ——————————————————————————————————————————————————————————————
    {
      name: "Badge shapes",
      pages: ["any"],
      // Only meaningful once several cards are on the page.
      guard: () => document.querySelectorAll(YTF.VIDEO_SELECTORS).length >= 3,
      test:  () => document.querySelector(YTF.SEL_BADGE) !== null,
    },
  ];

  function runCanaryChecks(pageType) {
    const failures = [];
    for (const check of CANARY_CHECKS) {
      const applies = check.pages.includes("any") || check.pages.includes(pageType);
      if (!applies) continue;
      if (check.guard && !check.guard()) continue;
      if (!check.test()) {
        failures.push({
          name: check.name,
          pass: false,
          detail: `"${check.name}" not found on ${pageType} page`,
        });
      }
    }
    return failures;
  }

  // ---------------------------------------------------------------------------
  // Detector-sanity check
  //
  // Sample already-resolved cards (stamped by the scan) and verify that the
  // key data extractors still return results.  Uses SEL_RICH_ITEM and
  // SEL_VIDEO_RENDERER from constants — same selector strings the scanner uses.
  // ---------------------------------------------------------------------------

  const SAMPLE_MIN  = 10;
  const SAMPLE_SIZE = 20;

  function runDetectorSanity() {
    const attr  = YTF.FILTERED_ATTR;
    const cards = Array.from(
      document.querySelectorAll(
        `${YTF.SEL_RICH_ITEM}[${attr}], ${YTF.SEL_VIDEO_RENDERER}[${attr}]`
      )
    )
      .filter((el) => {
        const v = el.getAttribute(attr);
        return v === "pass" || v === "1";
      })
      .slice(0, SAMPLE_SIZE);

    if (cards.length < SAMPLE_MIN) return [];

    let badgeFound = 0;
    let viewParsed = 0;
    let durParsed  = 0;

    for (const card of cards) {
      if (card.querySelector(YTF.SEL_BADGE))    badgeFound++;
      if (!isNaN(YTF.getViewCount(card)))        viewParsed++;
      if (YTF.getDurationText(card) !== null)    durParsed++;
    }

    const n = cards.length;
    const failures = [];

    if (badgeFound === 0) {
      failures.push({
        name: "Badge selector",
        pass: false,
        detail: `${YTF.SEL_BADGE}: 0/${n} cards — selector may be stale`,
      });
    }

    if (YTF.settings.hideLowViews && viewParsed === 0) {
      failures.push({
        name: "View-count extractor",
        pass: false,
        detail: `View count: 0/${n} sampled cards parsed — extractor may be stale`,
      });
    }

    const durEnabled = YTF.settings.hideShortDuration || YTF.settings.hideLongDuration;
    if (durEnabled && durParsed === 0) {
      failures.push({
        name: "Duration extractor",
        pass: false,
        detail: `Duration: 0/${n} sampled cards parsed — selector may be stale`,
      });
    }

    return failures;
  }

  // ---------------------------------------------------------------------------
  // Reporting
  // ---------------------------------------------------------------------------

  let lastWasHealthy = true;

  function reportStatus(failures) {
    const pass = failures.length === 0;

    const healthStatus = {
      timestamp: Date.now(),
      pageType: getPageType(),
      checks: pass
        ? [{ name: "All checks", pass: true, detail: "" }]
        : failures,
    };

    browser.storage.local.set({ healthStatus });

    // Badge update — content scripts cannot call browser.action directly.
    browser.runtime.sendMessage({
      type: "ytf-health-badge",
      text:  pass ? "" : "!",
      color: pass ? null : "#cc0000",
    }).catch(() => {});

    // Console: single grouped warn only on the first transition to failing.
    // Does not repeat on every check to avoid log spam.
    if (!pass && lastWasHealthy) {
      console.warn(
        "[YTF] Health check failed — YouTube DOM may have changed:\n" +
          failures.map((f) => `  • ${f.name}: ${f.detail}`).join("\n")
      );
    }

    lastWasHealthy = pass;
  }

  // ---------------------------------------------------------------------------
  // Scheduled check — 5s after each navigation
  // ---------------------------------------------------------------------------

  let healthTimer = null;

  function scheduleHealthCheck() {
    if (healthTimer) clearTimeout(healthTimer);
    healthTimer = setTimeout(() => {
      healthTimer = null;
      const pageType = getPageType();
      reportStatus([
        ...runCanaryChecks(pageType),
        ...runDetectorSanity(),
      ]);
    }, 5000);
  }

  // ---------------------------------------------------------------------------
  // Test helpers (callable from the browser console)
  // ---------------------------------------------------------------------------

  // Inject a fake failure to verify all three alert surfaces work
  // (console warn, toolbar badge, popup status section) without needing to
  // break a real selector.  Always fires the console warn regardless of the
  // previous health state by resetting the transition flag first.
  function simulateHealthFailure() {
    lastWasHealthy = true;  // force the healthy→failing transition so the warn fires
    reportStatus([{
      name: "Simulated failure",
      pass: false,
      detail: "YTF.simulateHealthFailure() — testing alert surfaces",
    }]);
  }

  // Run the real checks immediately, bypassing the 5s delay.
  function runHealthCheckNow() {
    if (healthTimer) {
      clearTimeout(healthTimer);
      healthTimer = null;
    }
    const pageType = getPageType();
    reportStatus([
      ...runCanaryChecks(pageType),
      ...runDetectorSanity(),
    ]);
  }

  // ---------------------------------------------------------------------------
  // Boot
  // ---------------------------------------------------------------------------

  window.addEventListener("yt-navigate-finish", scheduleHealthCheck);
  window.addEventListener("popstate", scheduleHealthCheck);

  // Initial check on first page load.  Content scripts run at document_idle so
  // the page is already rendering; 5s gives the scan time to resolve cards first.
  scheduleHealthCheck();

  Object.assign(window.YTF, {
    scheduleHealthCheck,
    runHealthCheckNow,
    simulateHealthFailure,
  });
})();
