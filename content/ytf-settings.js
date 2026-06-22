"use strict";

(function () {
  const YTF = window.YTF;

  const SETTINGS_DEFAULTS = {
    hideLivestreams:   true,
    hideLowViews:      true,
    viewThreshold:     50000,
    hideShorts:        true,
    hideMixes:         true,
    hidePlayables:     true,
    hideMembersOnly:   true,
    hideExploreTopics: true,
    hideTopicChips:    true,
    // Duration filter — opt-in (both default to false)
    hideShortDuration:  false,
    minDurationMinutes: 10,
    hideLongDuration:   false,
    maxDurationMinutes: 60,
  };

  const settings = Object.assign({}, SETTINGS_DEFAULTS);

  function loadSettings() {
    return browser.storage.local.get(SETTINGS_DEFAULTS).then((stored) => {
      Object.assign(settings, stored);
      YTF.log("Settings loaded:", JSON.stringify(settings));
    });
  }

  browser.runtime.onMessage.addListener((msg) => {
    if (!msg || msg.type !== "ytf-settings-update" || !msg.settings) return;
    Object.assign(settings, msg.settings);
    YTF.log("Settings updated:", JSON.stringify(msg.settings));
    YTF.resetAndRescan && YTF.resetAndRescan();
  });

  Object.assign(window.YTF, { SETTINGS_DEFAULTS, settings, loadSettings });
})();
