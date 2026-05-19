import React from "react";
import Link from "next/link";

type ArtistRef = {
  slug: string;
  name: string;
};

type TrackProps = {
  id: string;
  title: string;
  preview_url?: string | null | undefined;
  artists?: ArtistRef[];
  position?: number;
  remix_artists?: ArtistRef[];
  featured_artists?: ArtistRef[];
  bpm?: number | null;
  key?: string | null;
};

function parseKey(keyField: string | null | undefined): { musicalKey: string; camelot: string } {
  if (!keyField) return { musicalKey: "—", camelot: "—" };
  const parts = keyField.split(" | ");
  return {
    musicalKey: parts[0]?.trim() || "—",
    camelot: parts[1]?.trim() || "—",
  };
}

function ArtistLinks({ artists }: { artists: ArtistRef[] }) {
  if (artists.length === 0) return <span className="text-muted">—</span>;
  return (
    <>
      {artists.map((artist, idx) => (
        <React.Fragment key={artist.slug}>
          {idx > 0 && <span className="text-gray-600">, </span>}
          <Link
            href={`/artists/${artist.slug}`}
            className="text-blue-400 hover:text-blue-300 transition-colors"
          >
            {artist.name}
          </Link>
        </React.Fragment>
      ))}
    </>
  );
}

export default function ReleaseTrackList({
  tracks,
}: {
  tracks: TrackProps[];
  releaseTitle?: string;
}) {
  const sorted = tracks
    .slice()
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

  return (
    <section>
      <h2 className="mb-2 h-md">Track Data</h2>
      <p className="mb-8 text-sm text-muted">
        BPM and key reference for DJs. Use the player above to preview the release.
      </p>

      <div className="overflow-x-auto border border-gray-800 rounded-lg">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="px-5 py-3 text-left text-label w-12">#</th>
              <th className="px-5 py-3 text-left text-label">Track</th>
              <th className="px-5 py-3 text-left text-label">Artists</th>
              <th className="hidden px-5 py-3 text-right text-label sm:table-cell">BPM</th>
              <th className="hidden px-5 py-3 text-left text-label md:table-cell">Key</th>
              <th className="hidden px-5 py-3 text-left text-label md:table-cell">Camelot</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((t) => {
              const { musicalKey, camelot } = parseKey(t.key);
              const seen = new Set<string>();
              const allArtists = [
                ...(t.artists || []),
                ...(t.featured_artists || []),
                ...(t.remix_artists || []),
              ].filter((a) => {
                if (seen.has(a.slug)) return false;
                seen.add(a.slug);
                return true;
              });

              return (
                <tr key={t.id} className="border-b border-gray-800 last:border-0">
                  <td className="px-5 py-5 font-mono text-xs text-gray-500 tabular-nums">
                    {String(t.position ?? 0).padStart(2, "0")}
                  </td>
                  <td className="px-5 py-5 text-gray-200">
                    {t.title}
                  </td>
                  <td className="px-5 py-5 text-gray-400">
                    <ArtistLinks artists={allArtists} />
                  </td>
                  <td className="hidden px-5 py-5 font-mono text-xs text-right text-gray-500 tabular-nums sm:table-cell">
                    {t.bpm ?? "—"}
                  </td>
                  <td className="hidden px-5 py-5 text-gray-400 md:table-cell">
                    {musicalKey}
                  </td>
                  <td className="hidden px-5 py-5 font-mono text-xs text-gray-500 tabular-nums md:table-cell">
                    {camelot}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
