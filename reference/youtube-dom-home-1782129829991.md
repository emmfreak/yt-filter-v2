# YouTube DOM Map

- **Captured:** 2026-06-22T12:03:49.986Z
- **URL:** https://www.youtube.com/
- **Page type:** Home
- **Viewport:** 1920×947

> Capture this on multiple page types (home, a /watch video, search results) and give all of them to Claude for full coverage.

## Key Surfaces

Each block shows the live element (if present on this page) and a shallow tree.

### Home Feed (rich grid)
- **Selector tried:** `ytd-rich-grid-renderer`
- **Matched:** `ytd-rich-grid-renderer`
- **Count on page:** 1

```html
<ytd-rich-grid-renderer.style-scope.ytd-two-column-browse-results-renderer [elements-per-row="3" is-default-grid]>
  <div#header.style-scope.ytd-rich-grid-renderer [id="header"]>
    <ytd-feed-filter-chip-bar-renderer.style-scope.ytd-rich-grid-renderer [at-start frosted-glass-mode="with-chipbar" is-dark-theme fluid-width component-style="FEED_FILTER_CHIP_BAR_STYLE_TYPE_DEFAULT" at-end]>
      <div#chips-wrapper.style-scope.ytd-feed-filter-chip-bar-renderer [id="chips-wrapper"]>


  <div#big-yoodle.style-scope.ytd-rich-grid-renderer [id="big-yoodle"]>
  <div#masthead-ad.style-scope.ytd-rich-grid-renderer [id="masthead-ad"]>
  <div#title-container.style-scope.ytd-rich-grid-renderer [id="title-container" hidden]>
    <div#title.style-scope.ytd-rich-grid-renderer [id="title"]>
  <div#contents.style-scope.ytd-rich-grid-renderer [id="contents"]>
    <ytd-rich-item-renderer.style-scope.ytd-rich-grid-renderer [items-per-row="3" lockup="true" rendered-from-rich-grid is-in-first-column]>
      <div#content.style-scope.ytd-rich-item-renderer [id="content"]>

      <yt-interaction#interaction.extended.rounded-large.style-scope.ytd-rich-item-renderer [id="interaction" hidden]>


    <ytd-rich-item-renderer.style-scope.ytd-rich-grid-renderer [items-per-row="3" lockup="true" rendered-from-rich-grid]>
      <div#content.style-scope.ytd-rich-item-renderer [id="content"]>

      <yt-interaction#interaction.extended.rounded-large.style-scope.ytd-rich-item-renderer [id="interaction" hidden]>


    <ytd-rich-item-renderer.style-scope.ytd-rich-grid-renderer [items-per-row="3" lockup="true" rendered-from-rich-grid]>
      <div#content.style-scope.ytd-rich-item-renderer [id="content"]>

      <yt-interaction#interaction.extended.rounded-large.style-scope.ytd-rich-item-renderer [id="interaction" hidden]>


    <ytd-rich-item-renderer.style-scope.ytd-rich-grid-renderer [items-per-row="3" lockup="true" rendered-from-rich-grid is-in-first-column]>
      <div#content.style-scope.ytd-rich-item-renderer [id="content"]>

      <yt-interaction#interaction.extended.rounded-large.style-scope.ytd-rich-item-renderer [id="interaction" hidden]>


    <ytd-rich-item-renderer.style-scope.ytd-rich-grid-renderer [items-per-row="3" lockup="true" rendered-from-rich-grid]>
      <div#content.style-scope.ytd-rich-item-renderer [id="content"]>

      <yt-interaction#interaction.extended.rounded-large.style-scope.ytd-rich-item-renderer [id="interaction" hidden]>


    <ytd-rich-item-renderer.style-scope.ytd-rich-grid-renderer [items-per-row="3" lockup="true" rendered-from-rich-grid]>
      <div#content.style-scope.ytd-rich-item-renderer [id="content"]>

      <yt-interaction#interaction.extended.rounded-large.style-scope.ytd-rich-item-renderer [id="interaction" hidden]>


  <div#reload-content.style-scope.ytd-rich-grid-renderer [id="reload-content"]>
```

### Home Feed Row
- **Selector tried:** `ytd-rich-grid-row`
- **Status:** not present on this page

### Rich Item (card wrapper)
- **Selector tried:** `ytd-rich-item-renderer`
- **Matched:** `ytd-rich-item-renderer`
- **Count on page:** 24

```html
<ytd-rich-item-renderer.style-scope.ytd-rich-grid-renderer [items-per-row="3" lockup="true" rendered-from-rich-grid is-in-first-column]>
  <div#content.style-scope.ytd-rich-item-renderer [id="content"]>
    <yt-lockup-view-model.ytd-rich-item-renderer.lockup.ytLockupViewModelWrapper>
      <div.ytLockupViewModelHost.ytLockupViewModelVertical.content-id-HeBZ_dQQd1I.ytLockupViewModelRichGridLegacyMargin>



  <yt-interaction#interaction.extended.rounded-large.style-scope.ytd-rich-item-renderer [id="interaction" hidden]>
    <div.stroke.style-scope.yt-interaction>
    <div.fill.style-scope.yt-interaction>
```

### Video Renderer (card)
- **Selector tried:** `ytd-rich-grid-media, ytd-video-renderer, ytd-compact-video-renderer`
- **Status:** not present on this page

### Shorts Shelf
- **Selector tried:** `ytd-rich-shelf-renderer, ytd-reel-shelf-renderer`
- **Status:** not present on this page

### Shorts Item
- **Selector tried:** `ytm-shorts-lockup-view-model, ytd-reel-item-renderer`
- **Status:** not present on this page

### Sidebar (watch page)
- **Selector tried:** `#secondary, #related`
- **Matched:** `div#secondary`
- **Count on page:** 4

```html
<div#secondary.style-scope.ytd-two-column-browse-results-renderer [id="secondary"]>
```

### Sidebar Items
- **Selector tried:** `ytd-compact-video-renderer, yt-lockup-view-model`
- **Matched:** `yt-lockup-view-model`
- **Count on page:** 24

```html
<yt-lockup-view-model.ytd-rich-item-renderer.lockup.ytLockupViewModelWrapper>
  <div.ytLockupViewModelHost.ytLockupViewModelVertical.content-id-HeBZ_dQQd1I.ytLockupViewModelRichGridLegacyMargin>
    <yt-touch-feedback-shape.ytSpecTouchFeedbackShapeHost.ytSpecTouchFeedbackShapeTouchResponse.ytSpecTouchFeedbackShapeThumbnailSizeLarge.ytSpecTouchFeedbackShapeTriggerEvents [aria-hidden="true"]>
      <div.ytSpecTouchFeedbackShapeHoverEffect>
      <div.ytSpecTouchFeedbackShapeStroke>
      <div.ytSpecTouchFeedbackShapeFill>
    <a.ytLockupViewModelContentImage [href="/watch?v=HeBZ_dQQd1I" aria-haspopup="false" tabindex="-1" aria-hidden="true"]>
      <yt-thumbnail-view-model.ytThumbnailViewModelHost.ytThumbnailViewModelAspectRatio16By9.ytThumbnailViewModelLarge>


    <div.ytLockupViewModelMetadata>
      <yt-lockup-metadata-view-model.ytLockupMetadataViewModelHost.ytLockupMetadataViewModelVertical.ytLockupMetadataViewModelStandard.ytLockupMetadataViewModelTypographyBump>



```

### Watch Page Primary
- **Selector tried:** `#primary, ytd-watch-metadata`
- **Matched:** `div#primary`
- **Count on page:** 3

```html
<div#primary.style-scope.ytd-two-column-browse-results-renderer [id="primary"]>
  <ytd-rich-grid-renderer.style-scope.ytd-two-column-browse-results-renderer [elements-per-row="3" is-default-grid]>
    <div#header.style-scope.ytd-rich-grid-renderer [id="header"]>
      <ytd-feed-filter-chip-bar-renderer.style-scope.ytd-rich-grid-renderer [at-start frosted-glass-mode="with-chipbar" is-dark-theme fluid-width component-style="FEED_FILTER_CHIP_BAR_STYLE_TYPE_DEFAULT" at-end]>

    <div#big-yoodle.style-scope.ytd-rich-grid-renderer [id="big-yoodle"]>
    <div#masthead-ad.style-scope.ytd-rich-grid-renderer [id="masthead-ad"]>
    <div#title-container.style-scope.ytd-rich-grid-renderer [id="title-container" hidden]>
      <div#title.style-scope.ytd-rich-grid-renderer [id="title"]>
    <div#contents.style-scope.ytd-rich-grid-renderer [id="contents"]>
      <ytd-rich-item-renderer.style-scope.ytd-rich-grid-renderer [items-per-row="3" lockup="true" rendered-from-rich-grid is-in-first-column]>


      <ytd-rich-item-renderer.style-scope.ytd-rich-grid-renderer [items-per-row="3" lockup="true" rendered-from-rich-grid]>


      <ytd-rich-item-renderer.style-scope.ytd-rich-grid-renderer [items-per-row="3" lockup="true" rendered-from-rich-grid]>


      <ytd-rich-item-renderer.style-scope.ytd-rich-grid-renderer [items-per-row="3" lockup="true" rendered-from-rich-grid is-in-first-column]>


      <ytd-rich-item-renderer.style-scope.ytd-rich-grid-renderer [items-per-row="3" lockup="true" rendered-from-rich-grid]>


      <ytd-rich-item-renderer.style-scope.ytd-rich-grid-renderer [items-per-row="3" lockup="true" rendered-from-rich-grid]>


    <div#reload-content.style-scope.ytd-rich-grid-renderer [id="reload-content"]>
```

### Player
- **Selector tried:** `#movie_player, .html5-video-player`
- **Matched:** `div#movie_player`
- **Count on page:** 2

```html
<div#movie_player.html5-video-player.ytp-transparent.ytp-exp-bottom-control-flexbox.ytp-modern-caption [tabindex="-1" id="movie_player" data-version="/s/player/ac678d18/player_es6.vflset/en_GB/base.js" aria-label="YouTube Video Player"]>
  <div.html5-video-container [data-layer="0"]>
    <video.video-stream.html5-main-video [tabindex="-1" controlslist="nodownload"]>
  <div.ytp-gradient-top [data-layer="1"]>
  <div.ytp-chrome-top [data-layer="1"]>
    <div.ytp-title-channel>
      <div.ytp-title-beacon>
      <a.ytp-title-channel-logo [target="_blank" role="link" tabindex="0"]>
      <div.ytp-title-expanded-overlay>

    <div.ytp-title>
      <div.ytp-title-text>


  <button.ytp-unmute.ytp-popup.ytp-button.ytp-unmute-animated [data-layer="2"]>
    <div.ytp-unmute-inner>
      <div.ytp-unmute-icon>

      <div.ytp-unmute-text>
      <div.ytp-unmute-box>
  <div.ytp-overlay.ytp-speedmaster-overlay [data-layer="4"]>
    <div.ytp-speedmaster-user-edu.ytp-speedmaster-has-icon>
      <div.ytp-speedmaster-label>
      <div.ytp-speedmaster-icon>

  <div.ytp-suggested-action [data-layer="4"]>
    <div.ytp-button.ytp-suggested-action-badge.ytp-suggested-action-badge-with-controls.ytp-suggested-action>
      <div.ytp-suggested-action-badge-icon-container>
      <div.ytp-suggested-action-badge-expanded-content-container>


```

### Player Controls
- **Selector tried:** `.ytp-chrome-bottom`
- **Matched:** `div`
- **Count on page:** 1

```html
<div.ytp-chrome-bottom [data-layer="9"]>
  <div.ytp-progress-bar-container [aria-disabled="true"]>
    <div.ytp-heat-map-container>
      <div.ytp-heat-map-edu>
    <div.ytp-progress-bar [tabindex="0" role="slider" aria-label="Seek slider" aria-valuemin="0" aria-valuemax="0" aria-valuenow="0" aria-valuetext="0 Minutes 0 Seconds of 0 Minutes 0 Seconds"]>
      <div.ytp-chapters-container>

      <div.ytp-timed-markers-container>
      <div.ytp-clip-start-exclude>
      <div.ytp-clip-end-exclude>
      <div.ytp-scrubber-container>

    <div.ytp-fine-scrubbing-container>
      <div.ytp-fine-scrubbing-edu>
      <div.ytp-fine-scrubbing>





    <div.ytp-bound-time-left>
    <div.ytp-bound-time-right>
    <div.ytp-clip-start [title="Watch full video"]>
      <svg [height="100%" version="1.1" viewBox="0 0 14 14" width="100%"]>


  <div.ytp-chrome-controls>
    <div.ytp-left-controls>
      <button.ytp-play-button.ytp-button [aria-keyshortcuts="k" data-title-no-tooltip="Play" data-tooltip-title="Play (k)" aria-label="Play (k)"]>

      <a.ytp-prev-button.ytp-button [role="button" tabindex="0" aria-disabled="true"]>

      <a.ytp-next-button.ytp-button.ytp-playlist-ui [role="button" tabindex="0" data-tooltip-title="Next (SHIFT+n)" data-title-no-tooltip="Next" aria-keyshortcuts="SHIFT+n" aria-disabled="false" aria-label="Next (SHIFT+n)"]>

      <span.ytp-volume-area>


      <div.ytp-time-display.notranslate>



      <div.ytp-chapter-container>

    <div.ytp-right-controls>
      <button#infoButton.playerButton.ytp-button.autoHiding.sbhidden [draggable="false" id="infoButton" title="Open SponsorBlock Popup"]>

      <button#submitButton.playerButton.ytp-button [draggable="false" id="submitButton" title="Open Submission Menu"]>

      <button#deleteButton.playerButton.ytp-button [draggable="false" id="deleteButton" title="Clear Segments"]>

      <button#cancelSegmentButton.playerButton.ytp-button [draggable="false" id="cancelSegmentButton" title="Cancel Creating Segment"]>

      <button#startSegmentButton.playerButton.ytp-button [draggable="false" id="startSegmentButton" title="Start Segment Now"]>

      <div.ytp-right-controls-left>




```

### Guide / Left Nav
- **Selector tried:** `ytd-guide-renderer, tp-yt-app-drawer`
- **Matched:** `tp-yt-app-drawer#guide`
- **Count on page:** 2

```html
<tp-yt-app-drawer#guide.style-scope.ytd-app [id="guide" align="start" role="navigation" position="left" swipe-open opened persistent]>
  <div#scrim.style-scope.tp-yt-app-drawer [id="scrim"]>
  <div#contentContainer.style-scope.tp-yt-app-drawer [id="contentContainer" position="left" swipe-open opened persistent]>
    <div#guide-wrapper.style-scope.ytd-app [id="guide-wrapper"]>
      <div#guide-spacer.style-scope.ytd-app [id="guide-spacer"]>
      <div#guide-content.style-scope.ytd-app [id="guide-content"]>


```

### Masthead (top bar)
- **Selector tried:** `#masthead, ytd-masthead`
- **Matched:** `ytd-masthead#masthead`
- **Count on page:** 1

```html
<ytd-masthead#masthead.masthead-finish [id="masthead" logo-type="YOUTUBE_LOGO" slot="masthead" page-dark-theme frosted-glass-mode="with-chipbar" role="banner" dark guide-persistent-and-visible]>
  <iron-media-query.style-scope.ytd-masthead>
  <div#ticker.style-scope.ytd-masthead [id="ticker"]>
  <div#interstitial.style-scope.ytd-masthead [id="interstitial"]>
  <div#background.style-scope.ytd-masthead [id="background"]>
  <div#container.style-scope.ytd-masthead [id="container"]>
    <div#start.style-scope.ytd-masthead [id="start"]>
      <yt-icon-button#back-button.style-scope.ytd-masthead [id="back-button"]>


      <tp-yt-paper-tooltip#back-button-tooltip.style-scope.ytd-masthead [id="back-button-tooltip" for="back-button" disable-upgrade]>
      <yt-icon-button#guide-button.style-scope.ytd-masthead [id="guide-button" toggleable="true"]>


      <ytd-topbar-logo-renderer#logo.style-scope.ytd-masthead [id="logo"]>


      <div#skip-navigation.style-scope.ytd-masthead [id="skip-navigation"]>

    <div#center.style-scope.ytd-masthead [id="center"]>
      <yt-searchbox.ytSearchboxComponentHost.ytSearchboxComponentDesktop.ytd-masthead.ytSearchboxComponentHostDark [role="search" client-ve-type="10349"]>


      <yt-icon-button#search-button-narrow.style-scope.ytd-masthead [id="search-button-narrow"]>


      <div#voice-search-button.style-scope.ytd-masthead [id="voice-search-button"]>

      <div#ai-companion-button.style-scope.ytd-masthead [id="ai-companion-button" hidden]>
    <div#end.style-scope.ytd-masthead [id="end"]>
      <div#masthead-skeleton-icons [id="masthead-skeleton-icons" slot="masthead-skeleton"]>



      <div#buttons.style-scope.ytd-masthead [id="buttons"]>



```

### Search Results
- **Selector tried:** `ytd-search, ytd-section-list-renderer`
- **Status:** not present on this page

### Comments
- **Selector tried:** `ytd-comments, ytd-comment-thread-renderer`
- **Matched:** `ytd-comments#comments`
- **Count on page:** 1

```html
<ytd-comments#comments.style-scope.ytd-watch-flexy [id="comments" disable-upgrade hidden]>
```

## Full Video Card Anatomy

One card expanded deeper (depth 5) — this is usually what you target for hiding/resizing/filtering.

```html
<ytd-rich-item-renderer.style-scope.ytd-rich-grid-renderer [items-per-row="3" lockup="true" rendered-from-rich-grid is-in-first-column]>
  <div#content.style-scope.ytd-rich-item-renderer [id="content"]>
    <yt-lockup-view-model.ytd-rich-item-renderer.lockup.ytLockupViewModelWrapper>
      <div.ytLockupViewModelHost.ytLockupViewModelVertical.content-id-HeBZ_dQQd1I.ytLockupViewModelRichGridLegacyMargin>
        <yt-touch-feedback-shape.ytSpecTouchFeedbackShapeHost.ytSpecTouchFeedbackShapeTouchResponse.ytSpecTouchFeedbackShapeThumbnailSizeLarge.ytSpecTouchFeedbackShapeTriggerEvents [aria-hidden="true"]>
          <div.ytSpecTouchFeedbackShapeHoverEffect>
          <div.ytSpecTouchFeedbackShapeStroke>
          <div.ytSpecTouchFeedbackShapeFill>
        <a.ytLockupViewModelContentImage [href="/watch?v=HeBZ_dQQd1I" aria-haspopup="false" tabindex="-1" aria-hidden="true"]>
          <yt-thumbnail-view-model.ytThumbnailViewModelHost.ytThumbnailViewModelAspectRatio16By9.ytThumbnailViewModelLarge>


        <div.ytLockupViewModelMetadata>
          <yt-lockup-metadata-view-model.ytLockupMetadataViewModelHost.ytLockupMetadataViewModelVertical.ytLockupMetadataViewModelStandard.ytLockupMetadataViewModelTypographyBump>



  <yt-interaction#interaction.extended.rounded-large.style-scope.ytd-rich-item-renderer [id="interaction" hidden]>
    <div.stroke.style-scope.yt-interaction>
    <div.fill.style-scope.yt-interaction>
```

### Useful hooks on this card

- **Video link:** `a#` → `/watch?v=HeBZ_dQQd1I`
- **Duration badge:** `badge-shape` → "26:54"

## All Custom Elements On Page (106)

These hyphenated tags are YouTube's web components — the stable-ish targets.

- `badge-shape`
- `button-view-model`
- `chip-shape`
- `custom-style`
- `dom-if`
- `dom-repeat`
- `iron-iconset-svg`
- `iron-media-query`
- `iron-selector`
- `ps-dom-if`
- `ps-dom-repeat`
- `snackbar-container`
- `tp-yt-app-drawer`
- `tp-yt-paper-item`
- `tp-yt-paper-material`
- `tp-yt-paper-spinner`
- `tp-yt-paper-spinner-lite`
- `tp-yt-paper-tooltip`
- `yt-attributed-string`
- `yt-avatar-shape`
- `yt-badge-supported-renderer`
- `yt-badge-view-model`
- `yt-bigboard`
- `yt-button-shape`
- `yt-chip-cloud-chip-renderer`
- `yt-collection-thumbnail-view-model`
- `yt-collections-stack`
- `yt-content-metadata-view-model`
- `yt-decorated-avatar-view-model`
- `yt-draggable`
- `yt-ephemeral-actions`
- `yt-formatted-string`
- `yt-guide-manager`
- `yt-hotkey-manager`
- `yt-icon`
- `yt-icon-badge-shape`
- `yt-icon-button`
- `yt-image`
- `yt-img-shadow`
- `yt-inline-player-controls`
- `yt-interaction`
- `yt-lockup-metadata-view-model`
- `yt-lockup-view-model`
- `yt-mdx-manager`
- `yt-page-navigation-progress`
- `yt-playability-error-supported-renderers`
- `yt-playlist-manager`
- `yt-popover`
- `yt-searchbox`
- `yt-thumbnail-badge-view-model`
- `yt-thumbnail-bottom-overlay-view-model`
- `yt-thumbnail-overlay-badge-view-model`
- `yt-thumbnail-overlay-progress-bar-view-model`
- `yt-thumbnail-view-model`
- `yt-tooltip`
- `yt-touch-feedback-shape`
- `ytd-app`
- `ytd-badge-supported-renderer`
- `ytd-browse`
- `ytd-button-renderer`
- `ytd-channel-legal-info-renderer`
- `ytd-channel-name`
- `ytd-comments`
- `ytd-continuation-item-renderer`
- `ytd-feed-filter-chip-bar-renderer`
- `ytd-ghost-grid-renderer`
- `ytd-guide-collapsible-entry-renderer`
- `ytd-guide-collapsible-section-entry-renderer`
- `ytd-guide-downloads-entry-renderer`
- `ytd-guide-entry-renderer`
- `ytd-guide-renderer`
- `ytd-guide-section-renderer`
- `ytd-item-section-renderer`
- `ytd-logo`
- `ytd-lottie-player`
- `ytd-masthead`
- `ytd-metadata-row-container-renderer`
- `ytd-mini-guide-renderer`
- `ytd-miniplayer`
- `ytd-miniplayer-info-bar`
- `ytd-notification-topbar-button-renderer`
- `ytd-page-manager`
- `ytd-permission-role-bottom-bar-renderer`
- `ytd-player`
- `ytd-playlist-header-renderer`
- `ytd-playlist-panel-renderer`
- `ytd-playlist-sidebar-renderer`
- `ytd-popup-container`
- `ytd-refresh`
- `ytd-rich-grid-renderer`
- `ytd-rich-item-renderer`
- `ytd-sentiment-bar-renderer`
- `ytd-settings-sidebar-renderer`
- `ytd-third-party-manager`
- `ytd-thumbnail`
- `ytd-topbar-logo-renderer`
- `ytd-topbar-menu-button-renderer`
- `ytd-two-column-browse-results-renderer`
- `ytd-video-owner-renderer`
- `ytd-video-preview`
- `ytd-video-preview-loader`
- `ytd-video-primary-info-renderer`
- `ytd-watch-flexy`
- `ytd-watch-metadata`
- `ytd-watch-next-secondary-results-renderer`
- `ytd-yoodle-renderer`

