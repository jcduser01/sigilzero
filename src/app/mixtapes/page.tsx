// src/app/mixtapes/page.tsx

import { Suspense } from "react";
import { loadAllMixtapes } from "../../lib/content/load-mixtapes";
import { loadAllArtists } from "../../lib/content/load-artists";
import MixtapesCatalog from "./MixtapesCatalog";

function MixtapesCatalogContent() {
  const mixtapes = loadAllMixtapes();
  const artists = loadAllArtists();
  const activeMixtapes = mixtapes.filter((m) => m.meta.active);
  return <MixtapesCatalog mixtapes={activeMixtapes} artists={artists} />;
}

export default function MixtapesPage() {
  return (
    <Suspense fallback={<div className="p-4">Loading...</div>}>
      <MixtapesCatalogContent />
    </Suspense>
  );
}
