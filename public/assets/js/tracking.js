(function (window, document) {
  "use strict";

  var EVENT_NAME = "sigilzero_event";
  var DEBUG_LOCAL_STORAGE_KEY = "sigilzero_debug_tracking";
  var DEBUG_URL_PARAM = "debug_tracking";
  var DEFAULT_DEDUPE_WINDOW_MS = 400;
  var EMBED_DEDUPE_WINDOW_MS = 2000;
  var MAX_RECENT_KEYS = 200;
  var MAX_STRING_VALUE_LENGTH = 300;
  var IFRAME_BLUR_CHECK_DELAY_MS = 0;

  // GTM setup notes:
  // Create a Data Layer Variable in GTM for each flat key below.
  // Required event trigger value: event equals "sigilzero_event".
  // Recommended Data Layer Variables:
  // event
  // entity
  // action
  // target
  // platform
  // page_type
  // page_path
  // page_title
  // release_title
  // release_catalog_id
  // artist_name
  // track_title
  // cta_type
  // section
  // component
  // link_url
  // link_text
  // destination_domain
  // is_external
  // debug_source
  var allowedPayloadKeys = {
    event: true,
    entity: true,
    action: true,
    target: true,
    platform: true,
    page_type: true,
    page_path: true,
    page_title: true,
    release_title: true,
    release_catalog_id: true,
    artist_name: true,
    track_title: true,
    cta_type: true,
    section: true,
    component: true,
    link_url: true,
    link_text: true,
    destination_domain: true,
    is_external: true,
    debug_source: true,
  };

  var recentEventMap = new Map();

  function warn(message, details) {
    if (typeof console === "undefined" || typeof console.warn !== "function") {
      return;
    }

    if (typeof details !== "undefined") {
      console.warn("[SigilZeroTracking] " + message, details);
      return;
    }

    console.warn("[SigilZeroTracking] " + message);
  }

  function logDebug(message, payload) {
    if (!isDebugMode()) {
      return;
    }

    if (typeof console === "undefined" || typeof console.log !== "function") {
      return;
    }

    if (typeof payload !== "undefined") {
      console.log("[SigilZeroTracking] " + message, payload);
      return;
    }

    console.log("[SigilZeroTracking] " + message);
  }

  function getElementDataset(element) {
    if (!element || !element.dataset) {
      return undefined;
    }

    var dataset = {};
    var keys = Object.keys(element.dataset);

    for (var i = 0; i < keys.length; i += 1) {
      dataset[keys[i]] = element.dataset[keys[i]];
    }

    return dataset;
  }

  function ensureDataLayer() {
    window.dataLayer = window.dataLayer || [];
    return window.dataLayer;
  }

  function isDebugMode() {
    var fromLocalStorage = false;
    var fromUrlParam = false;

    try {
      fromLocalStorage = window.localStorage.getItem(DEBUG_LOCAL_STORAGE_KEY) === "true";
    } catch (error) {
      warn("Unable to read localStorage for debug flag.", error);
    }

    try {
      var params = new URLSearchParams(window.location.search || "");
      fromUrlParam = params.get(DEBUG_URL_PARAM) === "true";
    } catch (error) {
      warn("Unable to parse URL params for debug flag.", error);
    }

    return fromLocalStorage || fromUrlParam;
  }

  function sanitizeString(value) {
    if (typeof value === "undefined" || value === null) {
      return undefined;
    }

    var text = String(value).trim();
    if (!text) {
      return undefined;
    }

    if (containsEmail(text) || looksLikePhone(text)) {
      return undefined;
    }

    if (text.length > MAX_STRING_VALUE_LENGTH) {
      text = text.slice(0, MAX_STRING_VALUE_LENGTH);
    }

    return text;
  }

  function isPlainObject(value) {
    return Object.prototype.toString.call(value) === "[object Object]";
  }

  function isMailtoUrl(value) {
    return /^mailto:/i.test(String(value || "").trim());
  }

  function isTelUrl(value) {
    return /^tel:/i.test(String(value || "").trim());
  }

  function isContactUrl(value) {
    return isMailtoUrl(value) || isTelUrl(value);
  }

  function containsEmail(value) {
    return /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(value);
  }

  function looksLikePhone(value) {
    var normalized = String(value || "").replace(/[^0-9+]/g, "");
    if (normalized.length < 7) {
      return false;
    }

    return /^\+?[0-9]{7,15}$/.test(normalized);
  }

  function sanitizePath(pathValue) {
    if (typeof pathValue === "undefined" || pathValue === null) {
      return undefined;
    }

    var rawPath = String(pathValue).trim();
    if (!rawPath) {
      return undefined;
    }

    var withoutHash = rawPath.split("#")[0];
    var withoutQuery = withoutHash.split("?")[0];
    if (!withoutQuery) {
      return undefined;
    }

    if (withoutQuery.charAt(0) !== "/") {
      return "/" + withoutQuery;
    }

    return withoutQuery;
  }

  function sanitizeUrl(url) {
    if (typeof url === "undefined" || url === null) {
      return undefined;
    }

    var rawUrl = String(url).trim();
    if (!rawUrl) {
      return undefined;
    }

    if (isContactUrl(rawUrl)) {
      return undefined;
    }

    if (containsEmail(rawUrl)) {
      return undefined;
    }

    try {
      var parsed = new URL(rawUrl, window.location.origin);

      if (!/^https?:$/i.test(parsed.protocol)) {
        return undefined;
      }

      parsed.search = "";
      parsed.hash = "";

      var cleaned = parsed.toString();
      if (containsEmail(cleaned)) {
        return undefined;
      }

      return cleaned;
    } catch (error) {
      var strippedHash = rawUrl.split("#")[0];
      var strippedQuery = strippedHash.split("?")[0];

      if (!strippedQuery || containsEmail(strippedQuery)) {
        return undefined;
      }

      return strippedQuery;
    }
  }

  function isExternalUrl(url) {
    if (isContactUrl(url)) {
      return false;
    }

    var cleanedUrl = sanitizeUrl(url);
    if (!cleanedUrl) {
      return false;
    }

    try {
      var parsed = new URL(cleanedUrl, window.location.origin);
      return parsed.hostname !== window.location.hostname;
    } catch (error) {
      warn("Failed to evaluate external URL status.", { url: url, error: error });
      return false;
    }
  }

  function getDestinationDomain(url) {
    if (isContactUrl(url)) {
      return undefined;
    }

    var cleanedUrl = sanitizeUrl(url);
    if (!cleanedUrl) {
      return undefined;
    }

    try {
      var parsed = new URL(cleanedUrl, window.location.origin);
      if (parsed.hostname === window.location.hostname) {
        return undefined;
      }

      return sanitizeString(parsed.hostname);
    } catch (error) {
      warn("Failed to parse destination domain.", { url: url, error: error });
      return undefined;
    }
  }

  function sanitizeValue(value) {
    if (typeof value === "undefined" || value === null) {
      return undefined;
    }

    if (Array.isArray(value)) {
      return undefined;
    }

    if (isPlainObject(value)) {
      return undefined;
    }

    if (typeof value === "boolean") {
      return value;
    }

    if (typeof value === "number") {
      return isFinite(value) ? value : undefined;
    }

    return sanitizeString(value);
  }

  function getLinkTrackingMetadata(url) {
    if (isContactUrl(url)) {
      return {
        link_url: "redacted",
        destination_domain: undefined,
        is_external: false,
        is_contact_link: true,
      };
    }

    var cleanedUrl = sanitizeUrl(url);
    if (!cleanedUrl) {
      return {
        link_url: undefined,
        destination_domain: undefined,
        is_external: undefined,
        is_contact_link: false,
      };
    }

    var external = isExternalUrl(cleanedUrl);

    return {
      link_url: cleanedUrl,
      destination_domain: external ? getDestinationDomain(cleanedUrl) : undefined,
      is_external: external,
      is_contact_link: false,
    };
  }

  function getBodyData(name) {
    if (!document.body) {
      return undefined;
    }

    return sanitizeString(document.body.getAttribute("data-" + name));
  }

  function getPageContext() {
    return sanitizePayload({
      page_type: getBodyData("page-type"),
      page_path: sanitizePath(window.location.pathname || "/"),
      page_title: sanitizeString(document.title),
      release_title: getBodyData("release-title"),
      release_catalog_id: getBodyData("release-catalog-id"),
      artist_name: getBodyData("artist-name"),
    });
  }

  function getCurrentPageKey() {
    var context = getPageContext();

    return [
      sanitizePath(window.location.pathname || "/") || "",
      context.page_type || "",
      context.release_title || "",
      context.release_catalog_id || "",
      context.artist_name || "",
    ].join("|");
  }

  function sanitizePayload(payload) {
    var incoming = payload || {};
    var sanitized = {};
    var keys = Object.keys(incoming);

    for (var i = 0; i < keys.length; i += 1) {
      var key = keys[i];
      if (!allowedPayloadKeys[key]) {
        continue;
      }

      var value = incoming[key];
      if (typeof value === "undefined" || value === null) {
        continue;
      }

      if (key === "is_external") {
        if (typeof value === "boolean") {
          sanitized[key] = value;
        }
        continue;
      }

      if (key === "event") {
        sanitized[key] = EVENT_NAME;
        continue;
      }

      if (key === "link_url") {
        if (value === "redacted") {
          sanitized[key] = "redacted";
          continue;
        }

        var cleanedLinkUrl = sanitizeUrl(value);
        if (cleanedLinkUrl) {
          sanitized[key] = cleanedLinkUrl;
        }
        continue;
      }

      if (key === "page_path") {
        var cleanedPagePath = sanitizePath(value);
        if (cleanedPagePath) {
          sanitized[key] = cleanedPagePath;
        }
        continue;
      }

      if (key === "destination_domain") {
        var cleanedDomain = sanitizeString(value);
        if (cleanedDomain && !containsEmail(cleanedDomain) && !looksLikePhone(cleanedDomain)) {
          sanitized[key] = cleanedDomain;
        }
        continue;
      }

      var cleanedValue = sanitizeValue(value);
      if (typeof cleanedValue !== "undefined") {
        sanitized[key] = cleanedValue;
      }
    }

    return sanitized;
  }

  function fingerprintElement(element) {
    if (!element) {
      return "unknown";
    }

    var parts = [
      element.tagName || "",
      element.getAttribute("id") || "",
      element.getAttribute("data-entity") || "",
      element.getAttribute("data-action") || "",
      element.getAttribute("data-target") || "",
      element.getAttribute("href") || "",
      element.getAttribute("src") || "",
      (element.className && String(element.className).slice(0, 60)) || "",
    ];

    return parts.join("|");
  }

  function shouldDebounce(element, action, target, windowMs) {
    var now = Date.now();
    var dedupeWindow = typeof windowMs === "number" ? windowMs : DEFAULT_DEDUPE_WINDOW_MS;
    var key = [fingerprintElement(element), action || "", target || ""].join("::");
    var lastSeen = recentEventMap.get(key);

    if (typeof lastSeen === "number" && now - lastSeen < dedupeWindow) {
      return true;
    }

    recentEventMap.set(key, now);

    if (recentEventMap.size > MAX_RECENT_KEYS) {
      var expiration = now - dedupeWindow * 4;
      var iterator = recentEventMap.entries();
      var step = iterator.next();

      while (!step.done) {
        var entry = step.value;
        if (entry[1] < expiration) {
          recentEventMap.delete(entry[0]);
        }
        step = iterator.next();
      }
    }

    return false;
  }

  function resolveLinkText(element) {
    if (!element) {
      return undefined;
    }

    var ariaLabel = element.getAttribute("aria-label");
    if (ariaLabel) {
      return sanitizeString(ariaLabel);
    }

    var text = element.textContent || "";
    return sanitizeString(text.replace(/\s+/g, " "));
  }

  function inferPlatform(element) {
    var fromData = sanitizeString(element.getAttribute("data-platform"));
    if (fromData) {
      return fromData.toLowerCase();
    }

    var href = (element.getAttribute("href") || "").toLowerCase();
    var src = (element.getAttribute("src") || "").toLowerCase();
    var combined = href + " " + src;

    if (combined.indexOf("spotify.com") !== -1) {
      return "spotify";
    }

    if (combined.indexOf("music.apple.com") !== -1 || combined.indexOf("itunes.apple.com") !== -1) {
      return "apple_music";
    }

    if (combined.indexOf("music.youtube.com") !== -1) {
      return "youtube_music";
    }

    if (combined.indexOf("youtube.com") !== -1 || combined.indexOf("youtu.be") !== -1) {
      return "youtube";
    }

    if (combined.indexOf("soundcloud.com") !== -1) {
      return "soundcloud";
    }

    if (combined.indexOf("beatport.com") !== -1) {
      return "beatport";
    }

    if (combined.indexOf("bandcamp.com") !== -1) {
      return "bandcamp";
    }

    if (combined.indexOf("instagram.com") !== -1) {
      return "instagram";
    }

    if (combined.indexOf("facebook.com") !== -1 || combined.indexOf("fb.com") !== -1) {
      return "facebook";
    }

    if (combined.indexOf("music.amazon.com") !== -1) {
      return "amazon_music";
    }

    return undefined;
  }

  function isEmbedInteraction(element, platform) {
    if (!element) {
      return false;
    }

    var tagName = (element.tagName || "").toLowerCase();

    var role = (element.getAttribute("data-component") || "").toLowerCase();
    if (role.indexOf("embed") !== -1) {
      return platform === "spotify" || platform === "soundcloud";
    }

    var target = (element.getAttribute("data-target") || "").toLowerCase();
    if (target.indexOf("embed") !== -1) {
      return platform === "spotify" || platform === "soundcloud";
    }

    if (tagName === "a") {
      return false;
    }

    if (tagName === "iframe") {
      return platform === "spotify" || platform === "soundcloud";
    }

    return false;
  }

  function track(payload) {
    ensureDataLayer();

    var mergedPayload = {};
    var pageContext = getPageContext();
    var contextKeys = Object.keys(pageContext);

    for (var i = 0; i < contextKeys.length; i += 1) {
      mergedPayload[contextKeys[i]] = pageContext[contextKeys[i]];
    }

    var incoming = payload || {};
    var incomingKeys = Object.keys(incoming);
    for (var j = 0; j < incomingKeys.length; j += 1) {
      mergedPayload[incomingKeys[j]] = incoming[incomingKeys[j]];
    }

    mergedPayload.event = EVENT_NAME;

    if (isDebugMode()) {
      mergedPayload.debug_source = "tracking.js";
    }

    logDebug("Normalized payload before sanitization", mergedPayload);

    var sanitized = sanitizePayload(mergedPayload);

    logDebug("Final sanitized payload", sanitized);

    if (!sanitized.entity || !sanitized.action || !sanitized.target) {
      warn("Blocked event push because entity/action/target is missing after sanitization.", {
        original_payload: payload,
        sanitized_payload: sanitized,
      });
      logDebug("Event pushed", false);
      return undefined;
    }

    window.dataLayer.push(sanitized);
    logDebug("Pushed dataLayer event", sanitized);
    logDebug("Event pushed", true);

    return sanitized;
  }

  function trackPageView() {
    var pageType = getBodyData("page-type");
    var pageKey = getCurrentPageKey();

    var eventPayload = {
      entity: "page",
      action: "view",
      target: "page",
    };

    if (pageType === "release_detail") {
      eventPayload.entity = "release";
      eventPayload.action = "view";
      eventPayload.target = "detail_page";
    } else if (pageType === "artist_detail") {
      eventPayload.entity = "artist";
      eventPayload.action = "view";
      eventPayload.target = "profile_page";
    }

    var trackedEvent = track(eventPayload);

    if (trackedEvent) {
      window.SigilZeroTracking.__lastTrackedPath = window.location.pathname;
      window.SigilZeroTracking.__lastTrackedPageKey = pageKey;
    }

    return trackedEvent;
  }

  function trackClickFromElement(element, event) {
    if (!element || typeof element.closest !== "function") {
      warn("trackClickFromElement called without a valid element.", { element: element, event: event });
      return undefined;
    }

    var trackedElement = element.closest("[data-track='true']");
    if (!trackedElement) {
      return undefined;
    }

    logDebug("Raw element dataset", getElementDataset(trackedElement));

    var platform = inferPlatform(trackedElement);
    var entity = sanitizeString(trackedElement.getAttribute("data-entity"));
    var action = sanitizeString(trackedElement.getAttribute("data-action"));
    var target = sanitizeString(trackedElement.getAttribute("data-target"));

    if (!entity || !action || !target) {
      warn("Blocked tracked click because data-entity/data-action/data-target are required.", {
        element: trackedElement,
        dataset: getElementDataset(trackedElement),
        entity: entity,
        action: action,
        target: target,
      });
      logDebug("Event pushed", false);
      return undefined;
    }

    var payload = {
      entity: entity,
      action: action,
      target: target,
      platform: platform,
      release_title: sanitizeString(trackedElement.getAttribute("data-release-title")),
      release_catalog_id: sanitizeString(trackedElement.getAttribute("data-release-catalog-id")),
      artist_name: sanitizeString(trackedElement.getAttribute("data-artist-name")),
      track_title: sanitizeString(trackedElement.getAttribute("data-track-title")),
      cta_type: sanitizeString(trackedElement.getAttribute("data-cta-type")),
      section: sanitizeString(trackedElement.getAttribute("data-section")),
      component: sanitizeString(trackedElement.getAttribute("data-component")),
    };

    var embedInteraction = isEmbedInteraction(trackedElement, platform);
    if (embedInteraction) {
      payload.entity = "embed";
      payload.action = "play_intent";
      payload.target = platform === "soundcloud" ? "soundcloud_embed" : "spotify_embed";
      payload.platform = platform;
    }

    var isAnchor = trackedElement.tagName && trackedElement.tagName.toLowerCase() === "a";
    if (isAnchor) {
      var href = trackedElement.getAttribute("href");
      var linkMetadata = getLinkTrackingMetadata(href);

      if (linkMetadata.is_contact_link) {
        payload.target = "contact_link";
      }

      payload.link_url = linkMetadata.link_url;
      payload.link_text = resolveLinkText(trackedElement);
      payload.destination_domain = linkMetadata.destination_domain;
      payload.is_external = linkMetadata.is_external;
    }

    var dedupeWindow = embedInteraction ? EMBED_DEDUPE_WINDOW_MS : DEFAULT_DEDUPE_WINDOW_MS;
    if (shouldDebounce(trackedElement, payload.action, payload.target, dedupeWindow)) {
      logDebug("Debounced duplicate event", {
        action: payload.action,
        target: payload.target,
        element: trackedElement,
      });
      return undefined;
    }

    return track(payload);
  }

  function trackEmbedIntentFromElement(element, reason) {
    if (!element || typeof element.closest !== "function") {
      warn("trackEmbedIntentFromElement called without a valid element.", {
        element: element,
        reason: reason,
      });
      return undefined;
    }

    var trackedElement = element.closest("[data-track='true']");
    if (!trackedElement) {
      return undefined;
    }

    var platform = inferPlatform(trackedElement);
    if (!isEmbedInteraction(trackedElement, platform)) {
      return undefined;
    }

    var target = platform === "soundcloud" ? "soundcloud_embed" : "spotify_embed";

    if (shouldDebounce(trackedElement, "play_intent", target, EMBED_DEDUPE_WINDOW_MS)) {
      logDebug("Debounced embed intent", {
        reason: reason,
        target: target,
        element: trackedElement,
      });
      return undefined;
    }

    logDebug("Tracking embed intent", {
      reason: reason,
      dataset: getElementDataset(trackedElement),
    });

    return track({
      entity: "embed",
      action: "play_intent",
      target: target,
      platform: platform,
      release_title: sanitizeString(trackedElement.getAttribute("data-release-title")),
      release_catalog_id: sanitizeString(trackedElement.getAttribute("data-release-catalog-id")),
      artist_name: sanitizeString(trackedElement.getAttribute("data-artist-name")),
      track_title: sanitizeString(trackedElement.getAttribute("data-track-title")),
      cta_type: sanitizeString(trackedElement.getAttribute("data-cta-type")),
      section: sanitizeString(trackedElement.getAttribute("data-section")),
      component: sanitizeString(trackedElement.getAttribute("data-component")),
    });
  }

  function getTrackedEmbedFromActiveElement() {
    if (!document.activeElement) {
      return null;
    }

    var activeElement = document.activeElement;
    var tagName = (activeElement.tagName || "").toLowerCase();
    if (tagName !== "iframe") {
      return null;
    }

    if (typeof activeElement.closest !== "function") {
      return null;
    }

    var trackedElement = activeElement.closest("[data-track='true']");
    if (!trackedElement) {
      return null;
    }

    var platform = inferPlatform(trackedElement);
    if (!isEmbedInteraction(trackedElement, platform)) {
      return null;
    }

    return trackedElement;
  }

  function handleWindowBlur() {
    window.setTimeout(function () {
      var trackedEmbed = getTrackedEmbedFromActiveElement();
      if (!trackedEmbed) {
        return;
      }

      trackEmbedIntentFromElement(trackedEmbed, "iframe_blur");
    }, IFRAME_BLUR_CHECK_DELAY_MS);
  }

  function handleDocumentClick(event) {
    if (!event || !event.target || typeof event.target.closest !== "function") {
      return;
    }

    var trackedElement = event.target.closest("[data-track='true']");
    if (!trackedElement) {
      return;
    }

    trackClickFromElement(trackedElement, event);
  }

  function init() {
    ensureDataLayer();
    document.addEventListener("click", handleDocumentClick, false);
    window.addEventListener("blur", handleWindowBlur, false);
    logDebug("Tracking initialized", getPageContext());

    if (typeof window.dispatchEvent === "function" && typeof window.CustomEvent === "function") {
      window.dispatchEvent(new CustomEvent("sigilzero:tracking-ready"));
    }
  }

  if (window.SigilZeroTracking && window.SigilZeroTracking.__initialized) {
    warn("Tracking was already initialized. Skipping duplicate init.");
    ensureDataLayer();
    return;
  }

  window.SigilZeroTracking = {
    track: track,
    trackPageView: trackPageView,
    trackClickFromElement: trackClickFromElement,
    getPageContext: getPageContext,
    sanitizePayload: sanitizePayload,
    sanitizeUrl: sanitizeUrl,
    isExternalUrl: isExternalUrl,
    getDestinationDomain: getDestinationDomain,
    getLinkTrackingMetadata: getLinkTrackingMetadata,
    debugStatus: function () {
      var status = {
        debug_enabled: isDebugMode(),
        local_storage_enabled: false,
        query_param_enabled: false,
        last_tracked_path: window.SigilZeroTracking.__lastTrackedPath,
        last_tracked_page_key: window.SigilZeroTracking.__lastTrackedPageKey,
        data_layer_length: Array.isArray(window.dataLayer) ? window.dataLayer.length : 0,
      };

      try {
        status.local_storage_enabled = window.localStorage.getItem(DEBUG_LOCAL_STORAGE_KEY) === "true";
      } catch (error) {
        warn("Unable to read localStorage for debug status.", error);
      }

      try {
        var params = new URLSearchParams(window.location.search || "");
        status.query_param_enabled = params.get(DEBUG_URL_PARAM) === "true";
      } catch (error) {
        warn("Unable to parse URL params for debug status.", error);
      }

      logDebug("Debug status", status);
      return status;
    },
    testEvent: function () {
      return track({
        entity: "site",
        action: "debug",
        target: "tracking_test",
      });
    },
    getConsoleTestExamples: function () {
      return {
        query_stripping: sanitizeUrl("https://example.com/releases/test?utm_source=newsletter"),
        hash_stripping: sanitizeUrl("https://example.com/releases/test#listen-now"),
        undefined_removal: sanitizePayload({
          event: EVENT_NAME,
          entity: "release",
          action: "click",
          target: "streaming_link",
          link_url: undefined,
          destination_domain: "",
          section: [],
          component: {},
        }),
        mailto_redaction: getLinkTrackingMetadata("mailto:info@sigilzero.com"),
        tel_redaction: getLinkTrackingMetadata("tel:+15125551234"),
        external_domain_detection: {
          is_external: isExternalUrl("https://soundcloud.com/sigil-zero/test?ref=abc"),
          destination_domain: getDestinationDomain("https://soundcloud.com/sigil-zero/test?ref=abc"),
        },
      };
    },
    __lastTrackedPath: undefined,
    __lastTrackedPageKey: undefined,
    __initialized: false,
  };

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      function () {
        if (window.SigilZeroTracking.__initialized) {
          return;
        }

        init();
        window.SigilZeroTracking.__initialized = true;
      },
      { once: true }
    );
  } else {
    init();
    window.SigilZeroTracking.__initialized = true;
  }
})(window, document);
