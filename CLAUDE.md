# YouTube Feed Filter v2 — Firefox Extension

DOM baseline captured 2026-06-22. Update this file when YouTube changes break selectors.

## What it does
Filters the YouTube feed by hiding: livestreams, Shorts, Mixes, Playables, members-only content, low-view-count videos (configurable threshold). Also collapses the topic-chips bar and Shorts guide entry.

## File structure
```
manifest.json
styles.css            — .ytf-hidden
popup.html/css/js     — settings UI, sends messages to content script
content/
  ytf-constants.js   — window.YTF namespace bootstrap, shared constants
  ytf-utils.js       — log, parseViewCount, extractViewString, debounce
  ytf-settings.js    — SETTINGS_DEFAULTS, settings object, loadSettings, message listener
  ytf-detectors.js   — per-card detectors, shouldHide
  ytf-filters.js     — scanAndFilter, shelf/nav/chip hiding
  ytf-main.js        — init, SPA navigation, MutationObserver, periodic rescan
```
Content scripts share state via `window.YTF` (not ES modules — content scripts don't support them).

## DOM map (live as of 2026-06-22)

### Video cards — homepage & watch sidebar
Both the homepage and the watch-page sidebar use the same lockup component tree:

```
ytd-rich-item-renderer[lockup="true"]          ← hide target for homepage grid
  div#content
    yt-lockup-view-model                        ← hide target for watch sidebar
      div.ytLockupViewModelHost
        a.ytLockupViewModelContentImage[href]   ← video link (/watch?v=ID)
          yt-thumbnail-view-model
        div.ytLockupViewModelMetadata
          yt-lockup-metadata-view-model         ← contains channel + views + date as text
```

**Rule:** when scanning, process `ytd-rich-item-renderer` as the card unit on the homepage.
Any `yt-lockup-view-model` that is a descendant of `ytd-rich-item-renderer` gets stamped `"skip"`.
Standalone `yt-lockup-view-model` elements (watch sidebar) are processed independently.

### Video cards — search results
```
ytd-video-renderer[lockup="true"]
  div#dismissible
    ytd-thumbnail
      a#thumbnail[href]                         ← video link
    div.text-wrapper
      div#meta                                  ← contains title, channel, views
        #video-title
        ytd-channel-name
      div#channel-info
```
Metadata (view count, date) is inside `#meta` or `#metadata-line`.
`ytd-thumbnail-overlay-time-status-renderer` is present in search for LIVE/SHORTS badges.

### Shorts in search results
```
ytm-shorts-lockup-view-model                   ← always a Short; tag name is the signal
  a.shortsLockupViewModelHostEndpoint[href="/shorts/ID"]
  div.shortsLockupViewModelHostOutsideMetadata
    h3.shortsLockupViewModelHostMetadataTitle
```
Shorts in search sit inside a `grid-shelf-view-model` container. Walk up from `ytm-shorts-lockup-view-model` to the nearest `grid-shelf-view-model` or `ytd-reel-shelf-renderer` and hide the whole shelf.

### Badges
Badges (LIVE, SHORTS, MIX, duration) all use:
```
badge-shape
  .yt-badge-shape__text    ← text content, e.g. "LIVE", "SHORTS", "MIX", "26:54"
```
Duration strings contain ":" — status badges don't — so exact-match checks are safe.

### Chip bar (homepage topic chips)
```
ytd-rich-grid-renderer
  div#header                                   ← hide this to remove the gap
    ytd-feed-filter-chip-bar-renderer
      div#chips-wrapper
```
Hide both `ytd-feed-filter-chip-bar-renderer` AND its direct parent `div#header` (check `parentElement.id === "header"`).

### Left guide / Shorts nav entry
```
tp-yt-app-drawer#guide
  div#contentContainer
    div#guide-content
      ytd-guide-renderer
        ytd-guide-section-renderer
          ytd-guide-entry-renderer             ← find the one with a[href="/shorts"]
```
`ytd-guide-entry-renderer` confirmed present in home and watch captures.


## Settings keys
| Key               | Type   | Default | Description                         |
|-------------------|--------|---------|-------------------------------------|
| hideLivestreams   | bool   | true    |                                     |
| hideLowViews      | bool   | true    |                                     |
| viewThreshold     | number | 50000   | Minimum views to show               |
| hideShorts        | bool   | true    |                                     |
| hideMixes         | bool   | true    |                                     |
| hidePlayables     | bool   | true    |                                     |
| hideMembersOnly   | bool   | true    |                                     |
| hideExploreTopics | bool   | true    | Hides "Explore topics" shelves      |
| hideTopicChips    | bool   | true    | Hides homepage chip bar             |

## Filtering states (data-ytf-filtered attribute)
- unset — not yet processed (pending lazy load or first scan)
- `"1"` — hidden (ytf-hidden class applied)
- `"pass"` — checked, not filtered
- `"skip"` — yt-lockup-view-model nested inside a ytd- container; parent handles it

## Indeterminate / lazy-load handling
`isMetadataLoaded(el)` checks whether `yt-lockup-metadata-view-model` is present inside the card.
If absent, `shouldHide` returns `indeterminate: true` → element left unset → caught by:
1. MutationObserver debounced 250ms — fires as DOM fills in
2. Periodic rescan every 2s — catches anything the observer missed

## SPA navigation
YouTube is an SPA. On each navigation:
1. `yt-navigate-finish` fires (primary) or `popstate` fires (back/forward)
2. Clear all `data-ytf-filtered` marks and `ytf-hidden` classes
3. After 500ms delay: rescan
