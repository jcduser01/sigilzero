import type { MixtapeFilterCriteria } from "./mixtapes";
import type { ReleaseFilterCriteria } from "./releases";

/**
 * Convert MixtapeFilterCriteria to URLSearchParams
 * Array filters are comma-delimited to keep URLs compact
 */
export function mixtapeFiltersToSearchParams(
  filters: Partial<MixtapeFilterCriteria>
): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.query) params.set("q", filters.query);
  if (filters.artistIds?.length) {
    params.set("artist", filters.artistIds.join(","));
  }
  if (filters.platforms?.length) {
    params.set("platform", filters.platforms.join(","));
  }
  if (filters.genres?.length) {
    params.set("genre", filters.genres.join(","));
  }
  if (filters.moods?.length) {
    params.set("mood", filters.moods.join(","));
  }
  if (filters.tags?.length) {
    params.set("tag", filters.tags.join(","));
  }
  if (filters.year !== undefined) {
    params.set("year", String(filters.year));
  }

  return params;
}

/**
 * Convert URLSearchParams to MixtapeFilterCriteria
 * Comma-delimited values are split back into arrays
 */
export function searchParamsToMixtapeFilters(
  params: URLSearchParams
): MixtapeFilterCriteria {
  const filters: MixtapeFilterCriteria = {};

  const query = params.get("q");
  if (query) filters.query = query;

  const artistIds = params.get("artist");
  if (artistIds) filters.artistIds = artistIds.split(",").filter(Boolean);

  const platforms = params.get("platform");
  if (platforms) filters.platforms = platforms.split(",").filter(Boolean);

  const genres = params.get("genre");
  if (genres) filters.genres = genres.split(",").filter(Boolean);

  const moods = params.get("mood");
  if (moods) filters.moods = moods.split(",").filter(Boolean);

  const tags = params.get("tag");
  if (tags) filters.tags = tags.split(",").filter(Boolean);

  const year = params.get("year");
  if (year) filters.year = parseInt(year, 10);

  return filters;
}

/**
 * Convert ReleaseFilterCriteria to URLSearchParams
 * Array filters are comma-delimited to keep URLs compact
 */
export function releaseFiltersToSearchParams(
  filters: Partial<ReleaseFilterCriteria>
): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.query) params.set("q", filters.query);
  if (filters.seriesIds?.length) {
    params.set("series", filters.seriesIds.join(","));
  }
  if (filters.types?.length) {
    params.set("type", filters.types.join(","));
  }
  if (filters.artistIds?.length) {
    params.set("artist", filters.artistIds.join(","));
  }
  if (filters.genres?.length) {
    params.set("genre", filters.genres.join(","));
  }
  if (filters.moods?.length) {
    params.set("mood", filters.moods.join(","));
  }
  if (filters.year !== undefined) {
    params.set("year", String(filters.year));
  }
  if (filters.bpmMin !== undefined) {
    params.set("bpmMin", String(filters.bpmMin));
  }
  if (filters.bpmMax !== undefined) {
    params.set("bpmMax", String(filters.bpmMax));
  }
  if (filters.keys?.length) {
    params.set("key", filters.keys.join(","));
  }

  return params;
}

/**
 * Convert URLSearchParams to ReleaseFilterCriteria
 * Comma-delimited values are split back into arrays
 */
export function searchParamsToReleaseFilters(
  params: URLSearchParams
): ReleaseFilterCriteria {
  const filters: ReleaseFilterCriteria = {};

  const query = params.get("q");
  if (query) filters.query = query;

  const seriesIds = params.get("series");
  if (seriesIds) filters.seriesIds = seriesIds.split(",").filter(Boolean);

  const types = params.get("type");
  if (types) filters.types = types.split(",").filter(Boolean);

  const artistIds = params.get("artist");
  if (artistIds) filters.artistIds = artistIds.split(",").filter(Boolean);

  const genres = params.get("genre");
  if (genres) filters.genres = genres.split(",").filter(Boolean);

  const moods = params.get("mood");
  if (moods) filters.moods = moods.split(",").filter(Boolean);

  const year = params.get("year");
  if (year) filters.year = parseInt(year, 10);

  const bpmMin = params.get("bpmMin");
  if (bpmMin) filters.bpmMin = parseInt(bpmMin, 10);

  const bpmMax = params.get("bpmMax");
  if (bpmMax) filters.bpmMax = parseInt(bpmMax, 10);

  const keys = params.get("key");
  if (keys) filters.keys = keys.split(",").filter(Boolean);

  return filters;
}
