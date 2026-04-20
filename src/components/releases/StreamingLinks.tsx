import type { LinkGroup } from "../../lib/content/load-links";
import { platformLogos } from "./PlatformLogos";

type StreamingLinksProps = {
  streamingGroup?: LinkGroup | null;
  purchaseGroup?: LinkGroup | null;
  disabled?: boolean;
};

export default function StreamingLinks({
  streamingGroup,
  purchaseGroup,
  disabled = false,
}: StreamingLinksProps) {
  // When disabled, include all links (even empty URLs) to show the full button set
  const streamingLinks = disabled
    ? (streamingGroup?.links ?? [])
    : (streamingGroup?.links ?? []).filter((link) => link.url && link.url.trim() !== "");
  const purchaseLinks = disabled
    ? (purchaseGroup?.links ?? [])
    : (purchaseGroup?.links ?? []).filter((link) => link.url && link.url.trim() !== "");

  if (streamingLinks.length === 0 && purchaseLinks.length === 0) {
    return null;
  }

  const disabledButtonClass = "inline-flex items-center gap-2 px-4 py-2 text-sm border border-gray-800 rounded-lg opacity-35 cursor-not-allowed text-gray-600";
  const activeButtonClass = "inline-flex items-center gap-2 px-4 py-2 text-sm transition-colors border border-gray-700 rounded-lg hover:bg-sigil-grey-800 hover:border-gray-600";

  return (
    <div className="space-y-4">
      {streamingLinks.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-medium tracking-wide uppercase opacity-60">
            Stream
          </h3>
          <div className="flex flex-wrap gap-2">
            {streamingLinks.map((link, idx) => {
              const platform = link.platform?.toLowerCase() || link.name.toLowerCase();
              const logo = platformLogos[platform];
              const inner = (
                <>
                  {logo ? (
                    <div className="flex items-center justify-center">{logo}</div>
                  ) : (
                    <span>🎵</span>
                  )}
                  <span>{link.name}</span>
                  {!disabled && <span className="text-xs opacity-60">↗</span>}
                </>
              );

              return disabled ? (
                <span key={idx} className={disabledButtonClass} title={link.name}>
                  {inner}
                </span>
              ) : (
                <a
                  key={idx}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={activeButtonClass}
                  title={link.name}
                >
                  {inner}
                </a>
              );
            })}
          </div>
        </div>
      )}

      {purchaseLinks.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-medium tracking-wide uppercase opacity-60">
            Buy
          </h3>
          <div className="flex flex-wrap gap-2">
            {purchaseLinks.map((link, idx) => {
              const platform = link.platform?.toLowerCase() || link.name.toLowerCase();
              const logo = platformLogos[platform];
              const inner = (
                <>
                  {logo ? (
                    <div className="flex items-center justify-center">{logo}</div>
                  ) : (
                    <span>💿</span>
                  )}
                  <span>{link.name}</span>
                  {!disabled && <span className="text-xs opacity-60">↗</span>}
                </>
              );

              return disabled ? (
                <span key={idx} className={disabledButtonClass} title={link.name}>
                  {inner}
                </span>
              ) : (
                <a
                  key={idx}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={activeButtonClass}
                  title={link.name}
                >
                  {inner}
                </a>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

