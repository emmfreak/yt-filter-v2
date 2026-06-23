"use strict";

browser.runtime.onMessage.addListener((msg) => {
  if (!msg || msg.type !== "ytf-health-badge") return;
  if (msg.text) {
    browser.action.setBadgeText({ text: msg.text });
    browser.action.setBadgeBackgroundColor({ color: msg.color || "#cc0000" });
  } else {
    browser.action.setBadgeText({ text: "" });
  }
});
