"use strict";

window.YTF = window.YTF || {};

// ---------------------------------------------------------------------------
// Selector constants — one definition per selector string.
// Both the scanner (VIDEO_SELECTORS, YTD_CONTAINER_SELECTORS) and the health
// canaries reference these exports, so updating a selector string here
// automatically updates all dependents and trips the canary that guards it.
// ---------------------------------------------------------------------------
const SEL_RICH_ITEM      = "ytd-rich-item-renderer";        // homepage card unit
const SEL_VIDEO_RENDERER = "ytd-video-renderer";            // search result row
const SEL_LOCKUP         = "yt-lockup-view-model";          // watch sidebar card
const SEL_SHORTS         = "ytm-shorts-lockup-view-model";  // Shorts in search
const SEL_RICH_GRID      = "ytd-rich-grid-renderer";        // homepage outer grid
const SEL_FROSTED_GLASS  = "div#frosted-glass";             // chip-bar height anchor
const SEL_SECONDARY      = "#secondary";                    // watch page sidebar container
const SEL_BADGE          = "badge-shape";                   // badge element (duration, LIVE, …)

Object.assign(window.YTF, {
  LOG_PREFIX: "[YTF]",

  // Attribute stamped on every processed element.
  // Values: "1" = hidden, "pass" = OK, "skip" = nested inside ytd- parent (ignored), unset = pending.
  FILTERED_ATTR: "data-ytf-filtered",

  DEBOUNCE_MS: 250,
  RESCAN_INTERVAL_MS: 2000,

  // Named selector constants — used by both the scanner and the health canaries.
  SEL_RICH_ITEM,
  SEL_VIDEO_RENDERER,
  SEL_LOCKUP,
  SEL_SHORTS,
  SEL_RICH_GRID,
  SEL_FROSTED_GLASS,
  SEL_SECONDARY,
  SEL_BADGE,

  // Composite selectors built from the named constants above.
  // Sources (all from reference captures):
  //   SEL_RICH_ITEM  — homepage grid wrapper (home + watch + search captures, 24 per page)
  //   SEL_VIDEO_RENDERER — search result rows (search capture, 20 found)
  //   SEL_LOCKUP     — watch sidebar cards NOT inside ytd-rich-item-renderer (watch capture, 44 total)
  //   SEL_SHORTS     — Shorts cards in search results (search capture, 15 found)
  VIDEO_SELECTORS: [
    SEL_RICH_ITEM,
    SEL_VIDEO_RENDERER,
    SEL_LOCKUP,
    SEL_SHORTS,
  ].join(", "),

  // SEL_LOCKUP nested inside any of these is handled by the parent —
  // skip it so we don't double-process.
  YTD_CONTAINER_SELECTORS: [
    SEL_RICH_ITEM,
    SEL_VIDEO_RENDERER,
  ].join(", "),
});
