"use strict";

window.YTF = window.YTF || {};

Object.assign(window.YTF, {
  LOG_PREFIX: "[YTF]",

  // Attribute stamped on every processed element.
  // Values: "1" = hidden, "pass" = OK, "skip" = nested inside ytd- parent (ignored), unset = pending.
  FILTERED_ATTR: "data-ytf-filtered",

  DEBOUNCE_MS: 250,
  RESCAN_INTERVAL_MS: 2000,

  // Primary card selectors to scan.
  // Sources (all from reference captures):
  //   ytd-rich-item-renderer  — homepage grid wrapper (home + watch + search captures, 24 per page)
  //   ytd-video-renderer      — search result rows (search capture, 20 found)
  //   yt-lockup-view-model    — watch sidebar cards NOT inside ytd-rich-item-renderer (watch capture, 44 total)
  //   ytm-shorts-lockup-view-model — Shorts cards in search results (search capture, 15 found)
  VIDEO_SELECTORS: [
    "ytd-rich-item-renderer",
    "ytd-video-renderer",
    "yt-lockup-view-model",
    "ytm-shorts-lockup-view-model",
  ].join(", "),

  // yt-lockup-view-model nested inside any of these is handled by the parent —
  // skip it so we don't double-process.
  YTD_CONTAINER_SELECTORS: [
    "ytd-rich-item-renderer",
    "ytd-video-renderer",
  ].join(", "),
});
