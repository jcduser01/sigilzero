"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

type PageContextTrackerProps = {
  pageType: string;
  releaseTitle?: string;
  releaseCatalogId?: string;
  artistName?: string;
};

declare global {
  interface Window {
    SigilZeroTracking?: {
      trackPageView?: () => unknown;
      __lastTrackedPath?: string;
      __lastTrackedPageKey?: string;
    };
  }
}

function setOrRemoveBodyAttribute(name: string, value?: string) {
  if (!document.body) {
    return;
  }

  if (value) {
    document.body.setAttribute(name, value);
    return;
  }

  document.body.removeAttribute(name);
}

function getPageTrackingKey(
  pathname: string,
  pageType: string,
  releaseTitle?: string,
  releaseCatalogId?: string,
  artistName?: string
) {
  return [pathname, pageType, releaseTitle || "", releaseCatalogId || "", artistName || ""].join("|");
}

export default function PageContextTracker({
  pageType,
  releaseTitle,
  releaseCatalogId,
  artistName,
}: PageContextTrackerProps) {
  const pathname = usePathname();

  useEffect(() => {
    setOrRemoveBodyAttribute("data-page-type", pageType);
    setOrRemoveBodyAttribute("data-release-title", releaseTitle);
    setOrRemoveBodyAttribute("data-release-catalog-id", releaseCatalogId);
    setOrRemoveBodyAttribute("data-artist-name", artistName);

    if (!pathname || typeof window === "undefined") {
      return;
    }

    const pageKey = getPageTrackingKey(
      pathname,
      pageType,
      releaseTitle,
      releaseCatalogId,
      artistName
    );

    let retryTimeout: number | undefined;
    let isActive = true;
    let attemptCount = 0;
    const maxAttempts = 20;
    const retryIntervalMs = 100;

    const trackPageViewIfReady = () => {
      if (!isActive) {
        return true;
      }

      const tracking = window.SigilZeroTracking;
      if (!tracking || typeof tracking.trackPageView !== "function") {
        return false;
      }

      if (tracking.__lastTrackedPageKey === pageKey) {
        return true;
      }

      const trackedEvent = tracking.trackPageView();
      if (!trackedEvent) {
        return false;
      }

      tracking.__lastTrackedPath = pathname;
      tracking.__lastTrackedPageKey = pageKey;

      return true;
    };

    const handleTrackingReady = () => {
      trackPageViewIfReady();
    };

    const queueRetry = () => {
      if (!isActive) {
        return;
      }

      if (attemptCount >= maxAttempts) {
        return;
      }

      retryTimeout = window.setTimeout(() => {
        attemptCount += 1;

        if (trackPageViewIfReady()) {
          return;
        }

        queueRetry();
      }, retryIntervalMs);
    };

    if (!trackPageViewIfReady()) {
      window.addEventListener("sigilzero:tracking-ready", handleTrackingReady);
      queueRetry();
    }

    return () => {
      isActive = false;

      if (retryTimeout) {
        window.clearTimeout(retryTimeout);
      }

      window.removeEventListener("sigilzero:tracking-ready", handleTrackingReady);
    };
  }, [artistName, pageType, pathname, releaseCatalogId, releaseTitle]);

  return null;
}
