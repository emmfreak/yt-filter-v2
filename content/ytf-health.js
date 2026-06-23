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
  // guard(): the page has enough content rendered that this check is meaningful.
  //          Skipping when the guard fails prevents false positives on empty pages
  //          or pages that simply don't have the feature (e.g. /watch has no grid).
  // test(): the specific selector/condition under surveillance.
  // pages:  list of page types the check applies to, or ["any"] for all pages.
  // ---------------------------------------------------------------------------

  const CANARY_CHECKS = [
    {
      name: "Rich grid renderer",
      pages: ["home"],
      guard: () => document.querySelector("ytd-rich-item-renderer") !== null,
      test:  () => document.querySelector("ytd-rich-grid-renderer") !== null,
    },
    {
      name: "Lockup cards",
      pages: ["home"],
      guard: () => document.querySelector("ytd-rich-item-renderer") !== null,
      test:  () => document.querySelectorAll("yt-lockup-view-model").length > 0,
    },
    {
      name: "Frosted-glass header",
      pages: ["home"],
      guard: () => document.querySelector("ytd-rich-item-renderer") !== null,
      test:  () => document.querySelector("div#frosted-glass") !== null,
    },
    {
      name: "Video renderer",
      pages: ["search"],
      // guard on the section container, not the renderers themselves (which might be 0 if all hidden)
      guard: () => document.querySelector("ytd-item-section-renderer") !== null,
      test:  () => document.querySelectorAll("ytd-video-renderer").length > 0,
    },
    {
      name: "Watch sidebar",
      pages: ["watch"],
      guard: () => document.querySelector("ytd-watch-flexy, #player") !== null,
      test:  () => document.querySelector("#secondary") !== null,
    },
    {
      name: "Badge shapes",
      pages: ["any"],
      // only meaningful once there are several cards on the page
      guard: () => document.querySelectorAll(YTF.VIDEO_SELECTORS).length >= 3,
      test:  () => document.querySelector("badge-shape") !== null,
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
  // key data extractors still return results.  No new DOM walking — we reuse
  // YTF.getViewCount / YTF.getDurationText on elements the scan already visited.
  // ---------------------------------------------------------------------------

  const SAMPLE_MIN  = 10;
  const SAMPLE_SIZE = 20;

  function runDetectorSanity() {
    const attr  = YTF.FILTERED_ATTR;
    const cards = Array.from(
      document.querySelectorAll(
        `ytd-rich-item-renderer[${attr}], ytd-video-renderer[${attr}]`
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
      if (card.querySelector("badge-shape")) badgeFound++;
      if (!isNaN(YTF.getViewCount(card)))    viewParsed++;
      if (YTF.getDurationText(card) !== null) durParsed++;
    }

    const n = cards.length;
    const failures = [];

    if (badgeFound === 0) {
      failures.push({
        name: "Badge selector",
        pass: false,
        detail: `badge-shape: 0/${n} cards — selector may be stale`,
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
      text: pass ? "" : "!",
      color: pass ? null : "#cc0000",
    }).catch(() => {});

    // Console: single grouped warn only on the first transition to failing.
    // Does not repeat on every scan to avoid log spam.
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
      const failures = [
        ...runCanaryChecks(pageType),
        ...runDetectorSanity(),
      ];
      reportStatus(failures);
    }, 5000);
  }

  window.addEventListener("yt-navigate-finish", scheduleHealthCheck);
  window.addEventListener("popstate", scheduleHealthCheck);

  // Initial check on first page load (content scripts run at document_idle,
  // so the page is already rendering — 5s gives the scan time to complete first).
  scheduleHealthCheck();

  Object.assign(window.YTF, { scheduleHealthCheck });
})();
