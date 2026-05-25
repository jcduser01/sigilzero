// src/app/releases/page.tsx

import { Suspense } from "react";
import { loadAllReleases } from "../../lib/content/load-releases";
import { loadSeriesRegistry } from "../../lib/content/load-series-registry";
import { loadAllArtists } from "../../lib/content/load-artists";
import { hasActiveSeries } from "../../lib/content/load-series";
import ReleasesCatalog from "./ReleasesCatalog";
import PageContextTracker from "../../components/tracking/PageContextTracker";

function ReleasesCatalogContent() {
  const releases = loadAllReleases();
  const seriesRegistry = loadSeriesRegistry();
  const artists = loadAllArtists();
  const activeReleases = releases.filter((r) => r.meta.active);
  const showSeriesFilter = hasActiveSeries();

  return (
    <>
      <PageContextTracker pageType="releases_index" />
      <ReleasesCatalog
        releases={activeReleases}
        seriesRegistry={seriesRegistry}
        artists={artists}
        showSeriesFilter={showSeriesFilter}
      />
    </>
  );
}

export default function ReleasesPage() {
  return (
    <Suspense fallback={<div className="p-4">Loading...</div>}>
      <ReleasesCatalogContent />
    </Suspense>
  );
}
