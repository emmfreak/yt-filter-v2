"use strict";

const DEFAULTS = {
  hideLivestreams:   true,
  hideLowViews:      true,
  viewThreshold:     50000,
  hideShorts:        true,
  hideMixes:         true,
  hidePlayables:     true,
  hideMembersOnly:   true,
  hideExploreTopics: true,
  hideTopicChips:    true,
};

const TOGGLE_IDS = [
  "hideLivestreams", "hideLowViews", "hideShorts", "hideMixes",
  "hidePlayables", "hideMembersOnly", "hideExploreTopics", "hideTopicChips",
];

const NUMBER_IDS = ["viewThreshold"];

function loadSettings() {
  browser.storage.local.get(DEFAULTS).then((s) => {
    for (const id of TOGGLE_IDS) document.getElementById(id).checked = s[id];
    for (const id of NUMBER_IDS) document.getElementById(id).value = s[id];
  });
}

function saveAndNotify(key, value) {
  const update = { [key]: value };
  browser.storage.local.set(update).then(() => {
    browser.tabs.query({ url: "*://*.youtube.com/*" }).then((tabs) => {
      for (const tab of tabs) {
        browser.tabs.sendMessage(tab.id, {
          type: "ytf-settings-update",
          settings: update,
        }).catch(() => {});
      }
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  loadSettings();

  for (const id of TOGGLE_IDS) {
    document.getElementById(id).addEventListener("change", (e) => {
      saveAndNotify(id, e.target.checked);
    });
  }

  for (const id of NUMBER_IDS) {
    const el = document.getElementById(id);
    el.addEventListener("change", () => {
      let val = parseInt(el.value, 10);
      if (isNaN(val)) val = DEFAULTS[id];
      if (el.min && val < parseInt(el.min, 10)) val = parseInt(el.min, 10);
      if (el.max && val > parseInt(el.max, 10)) val = parseInt(el.max, 10);
      el.value = val;
      saveAndNotify(id, val);
    });
  }
});
