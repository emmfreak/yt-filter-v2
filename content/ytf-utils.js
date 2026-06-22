"use strict";

(function () {
  const YTF = window.YTF;

  function log(...args) {
    console.log(YTF.LOG_PREFIX, ...args);
  }

  // Parse abbreviated view counts: "14m views" → 14000000, "350k views" → 350000, "0" → 0.
  // Returns NaN if the text can't be parsed.
  function parseViewCount(text) {
    if (!text) return NaN;
    const cleaned = text.replace(/,/g, "").trim();
    if (/no views/i.test(cleaned)) return 0;
    const match = cleaned.match(/([\d]+(?:\.[\d]+)?)\s*([KkMmBbTt]?)/);
    if (!match) return NaN;
    const num = parseFloat(match[1]);
    const suffix = match[2].toUpperCase();
    const multipliers = { "": 1, K: 1e3, M: 1e6, B: 1e9, T: 1e12 };
    const multiplier = multipliers[suffix];
    if (multiplier === undefined) return NaN;
    return num * multiplier;
  }

  // Pull the view-count substring out of a larger text blob.
  function extractViewString(text) {
    if (!text) return null;
    const m = text.match(/(?:no views|[\d,]+(?:\.[\d]+)?\s*[KkMmBbTt]?\s*views?)/i);
    return m ? m[0] : null;
  }

  // Returns a debounced version of fn.
  function debounce(fn, ms) {
    let timer = null;
    return function (...args) {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => { timer = null; fn.apply(this, args); }, ms);
    };
  }

  Object.assign(window.YTF, { log, parseViewCount, extractViewString, debounce });
})();
