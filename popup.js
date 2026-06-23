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
  hideShortDuration:  false,
  minDurationMinutes: 10,
  hideLongDuration:   false,
  maxDurationMinutes: 60,
};

const TOGGLE_IDS = [
  "hideLivestreams", "hideLowViews", "hideShorts", "hideMixes",
  "hidePlayables", "hideMembersOnly", "hideExploreTopics", "hideTopicChips",
  "hideShortDuration", "hideLongDuration",
];

const NUMBER_IDS = ["viewThreshold", "minDurationMinutes", "maxDurationMinutes"];

function loadSettings() {
  browser.storage.local.get(DEFAULTS).then((s) => {
    for (const id of TOGGLE_IDS) document.getElementById(id).checked = s[id];
    for (const id of NUMBER_IDS) document.getElementById(id).value = s[id];
  });
}

function loadHealth() {
  browser.storage.local.get("healthStatus").then((data) => {
    const row    = document.getElementById("health-status");
    const dot    = document.getElementById("health-dot");
    const textEl = document.getElementById("health-text");
    const s = data.healthStatus;

    if (!s) {
      row.className = "ytf-health-status ytf-health-unknown";
      dot.textContent  = "·";
      textEl.textContent = "No health data yet — visit YouTube to run checks";
      return;
    }

    const failing = s.checks.filter((c) => !c.pass);

    if (failing.length === 0) {
      row.className = "ytf-health-status ytf-health-ok";
      dot.textContent  = "✓";
      textEl.textContent = "All checks passing";
    } else {
      row.className = "ytf-health-status ytf-health-fail";
      dot.textContent  = "!";
      textEl.textContent = "";
      failing.forEach((f, i) => {
        if (i > 0) textEl.appendChild(document.createElement("br"));
        textEl.appendChild(document.createTextNode(f.detail || f.name));
      });
    }
  });
}

function sendHealthCommand(type) {
  browser.tabs.query({ active: true, url: "*://*.youtube.com/*" }).then((tabs) => {
    if (!tabs.length) return;
    browser.tabs.sendMessage(tabs[0].id, { type }).catch(() => {});
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

// Re-render the health section whenever the content script writes new results.
browser.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.healthStatus) loadHealth();
});

document.addEventListener("DOMContentLoaded", () => {
  loadSettings();
  loadHealth();

  document.getElementById("btn-test-alert").addEventListener("click", () => {
    sendHealthCommand("ytf-test-simulate-failure");
  });
  document.getElementById("btn-recheck").addEventListener("click", () => {
    sendHealthCommand("ytf-run-health-now");
  });

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
