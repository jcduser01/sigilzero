type Props = {
  spotifyUrl: string;
  title: string;
  releaseTitle?: string;
  releaseCatalogId?: string;
};

function buildEmbedUrl(spotifyUrl: string): string | null {
  if (!spotifyUrl) return null;
  try {
    const url = new URL(spotifyUrl);
    if (!url.hostname.includes("spotify.com")) return null;
    // pathname is like /track/ID or /album/ID
    return `https://open.spotify.com/embed${url.pathname}?utm_source=generator&theme=0`;
  } catch {
    return null;
  }
}

export default function SpotifyEmbed({ spotifyUrl, title, releaseTitle, releaseCatalogId }: Props) {
  const embedUrl = buildEmbedUrl(spotifyUrl);
  if (!embedUrl) return null;

  let height = 152;
  try {
    const url = new URL(spotifyUrl);
    if (!url.pathname.startsWith("/track/")) {
      height = 352;
    }
  } catch {
    // use default single-track height
  }

  return (
    <div
      data-track="true"
      data-entity="embed"
      data-action="play_intent"
      data-target="spotify_embed"
      data-platform="spotify"
      data-release-title={releaseTitle}
      data-release-catalog-id={releaseCatalogId}
    >
      <iframe
        title={title}
        src={embedUrl}
        width="100%"
        height={height}
        className="rounded-xl"
        frameBorder="0"
        allowFullScreen
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
      />
    </div>
  );
}
