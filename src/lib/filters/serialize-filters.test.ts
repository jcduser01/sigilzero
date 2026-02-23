import { describe, it, expect } from "vitest";
import {
  mixtapeFiltersToSearchParams,
  searchParamsToMixtapeFilters,
  releaseFiltersToSearchParams,
  searchParamsToReleaseFilters,
} from "./serialize-filters";
import type { MixtapeFilterCriteria } from "./mixtapes";
import type { ReleaseFilterCriteria } from "./releases";

describe("Mixtape Filter Serialization", () => {
  describe("mixtapeFiltersToSearchParams", () => {
    it("should serialize empty filters to empty URL", () => {
      const params = mixtapeFiltersToSearchParams({});
      expect(params.toString()).toBe("");
    });

    it("should serialize query parameter", () => {
      const params = mixtapeFiltersToSearchParams({ query: "dyson" });
      expect(params.toString()).toBe("q=dyson");
    });

    it("should serialize a single artist", () => {
      const params = mixtapeFiltersToSearchParams({ artistIds: ["dyson-hope"] });
      expect(params.toString()).toBe("artist=dyson-hope");
    });

    it("should serialize multiple artists as comma-delimited", () => {
      const params = mixtapeFiltersToSearchParams({
        artistIds: ["dyson-hope", "nototo", "b-squared"],
      });
      expect(params.toString()).toBe("artist=dyson-hope%2Cnototo%2Cb-squared");
    });

    it("should serialize multiple platforms as comma-delimited", () => {
      const params = mixtapeFiltersToSearchParams({
        platforms: ["soundcloud", "youtube"],
      });
      expect(params.toString()).toBe("platform=soundcloud%2Cyoutube");
    });

    it("should serialize multiple genres as comma-delimited", () => {
      const params = mixtapeFiltersToSearchParams({
        genres: ["techno", "house", "deep-house"],
      });
      expect(params.toString()).toBe("genre=techno%2Chouse%2Cdeep-house");
    });

    it("should serialize multiple moods as comma-delimited", () => {
      const params = mixtapeFiltersToSearchParams({
        moods: ["dark", "hypnotic"],
      });
      expect(params.toString()).toBe("mood=dark%2Chypnotic");
    });

    it("should serialize multiple tags as comma-delimited", () => {
      const params = mixtapeFiltersToSearchParams({
        tags: ["live", "remix"],
      });
      expect(params.toString()).toBe("tag=live%2Cremix");
    });

    it("should serialize year", () => {
      const params = mixtapeFiltersToSearchParams({ year: 2025 });
      expect(params.toString()).toBe("year=2025");
    });

    it("should serialize all filters combined", () => {
      const filters: MixtapeFilterCriteria = {
        query: "live set",
        artistIds: ["dyson-hope", "nototo"],
        platforms: ["soundcloud"],
        genres: ["techno", "house"],
        moods: ["dark"],
        tags: ["live"],
        year: 2025,
      };
      const params = mixtapeFiltersToSearchParams(filters);
      const str = params.toString();
      expect(str).toContain("q=live");
      expect(str).toContain("artist=dyson-hope%2Cnototo");
      expect(str).toContain("platform=soundcloud");
      expect(str).toContain("genre=techno%2Chouse");
      expect(str).toContain("mood=dark");
      expect(str).toContain("tag=live");
      expect(str).toContain("year=2025");
    });

    it("should not include empty arrays in params", () => {
      const params = mixtapeFiltersToSearchParams({
        artistIds: [],
        genres: [],
      });
      expect(params.toString()).toBe("");
    });

    it("should not include undefined values in params", () => {
      const params = mixtapeFiltersToSearchParams({
        query: undefined,
        year: undefined,
      });
      expect(params.toString()).toBe("");
    });
  });

  describe("searchParamsToMixtapeFilters", () => {
    it("should parse empty params to empty filters", () => {
      const params = new URLSearchParams("");
      const filters = searchParamsToMixtapeFilters(params);
      expect(filters).toEqual({});
    });

    it("should parse query parameter", () => {
      const params = new URLSearchParams("q=dyson");
      const filters = searchParamsToMixtapeFilters(params);
      expect(filters.query).toBe("dyson");
    });

    it("should parse single artist", () => {
      const params = new URLSearchParams("artist=dyson-hope");
      const filters = searchParamsToMixtapeFilters(params);
      expect(filters.artistIds).toEqual(["dyson-hope"]);
    });

    it("should parse multiple comma-delimited artists", () => {
      const params = new URLSearchParams("artist=dyson-hope,nototo,b-squared");
      const filters = searchParamsToMixtapeFilters(params);
      expect(filters.artistIds).toEqual(["dyson-hope", "nototo", "b-squared"]);
    });

    it("should parse multiple comma-delimited platforms", () => {
      const params = new URLSearchParams("platform=soundcloud,youtube");
      const filters = searchParamsToMixtapeFilters(params);
      expect(filters.platforms).toEqual(["soundcloud", "youtube"]);
    });

    it("should parse multiple comma-delimited genres", () => {
      const params = new URLSearchParams("genre=techno,house,deep-house");
      const filters = searchParamsToMixtapeFilters(params);
      expect(filters.genres).toEqual(["techno", "house", "deep-house"]);
    });

    it("should parse multiple comma-delimited moods", () => {
      const params = new URLSearchParams("mood=dark,hypnotic");
      const filters = searchParamsToMixtapeFilters(params);
      expect(filters.moods).toEqual(["dark", "hypnotic"]);
    });

    it("should parse multiple comma-delimited tags", () => {
      const params = new URLSearchParams("tag=live,remix");
      const filters = searchParamsToMixtapeFilters(params);
      expect(filters.tags).toEqual(["live", "remix"]);
    });

    it("should parse year as number", () => {
      const params = new URLSearchParams("year=2025");
      const filters = searchParamsToMixtapeFilters(params);
      expect(filters.year).toBe(2025);
    });

    it("should parse all params combined", () => {
      const params = new URLSearchParams(
        "q=live&artist=dyson-hope,nototo&platform=soundcloud&genre=techno,house&mood=dark&tag=live&year=2025"
      );
      const filters = searchParamsToMixtapeFilters(params);
      expect(filters.query).toBe("live");
      expect(filters.artistIds).toEqual(["dyson-hope", "nototo"]);
      expect(filters.platforms).toEqual(["soundcloud"]);
      expect(filters.genres).toEqual(["techno", "house"]);
      expect(filters.moods).toEqual(["dark"]);
      expect(filters.tags).toEqual(["live"]);
      expect(filters.year).toBe(2025);
    });

    it("should filter out empty strings from comma-delimited values", () => {
      const params = new URLSearchParams("genre=techno,,house,");
      const filters = searchParamsToMixtapeFilters(params);
      expect(filters.genres).toEqual(["techno", "house"]);
    });

    it("should handle missing optional params gracefully", () => {
      const params = new URLSearchParams("q=test");
      const filters = searchParamsToMixtapeFilters(params);
      expect(filters.query).toBe("test");
      expect(filters.artistIds).toBeUndefined();
      expect(filters.platforms).toBeUndefined();
      expect(filters.year).toBeUndefined();
    });
  });

  describe("Round-trip serialization (Mixtapes)", () => {
    it("should round-trip empty filters", () => {
      const original: MixtapeFilterCriteria = {};
      const params = mixtapeFiltersToSearchParams(original);
      const restored = searchParamsToMixtapeFilters(params);
      expect(restored).toEqual(original);
    });

    it("should round-trip complex filters", () => {
      const original: MixtapeFilterCriteria = {
        query: "live set",
        artistIds: ["dyson-hope", "nototo"],
        platforms: ["soundcloud", "youtube"],
        genres: ["techno", "house"],
        moods: ["dark", "hypnotic"],
        tags: ["live"],
        year: 2024,
      };
      const params = mixtapeFiltersToSearchParams(original);
      const restored = searchParamsToMixtapeFilters(params);
      expect(restored).toEqual(original);
    });
  });
});

describe("Release Filter Serialization", () => {
  describe("releaseFiltersToSearchParams", () => {
    it("should serialize empty filters to empty URL", () => {
      const params = releaseFiltersToSearchParams({});
      expect(params.toString()).toBe("");
    });

    it("should serialize query parameter", () => {
      const params = releaseFiltersToSearchParams({ query: "rhythm" });
      expect(params.toString()).toBe("q=rhythm");
    });

    it("should serialize a single series", () => {
      const params = releaseFiltersToSearchParams({ seriesIds: ["core"] });
      expect(params.toString()).toBe("series=core");
    });

    it("should serialize multiple series as comma-delimited", () => {
      const params = releaseFiltersToSearchParams({
        seriesIds: ["core", "black", "red"],
      });
      expect(params.toString()).toBe("series=core%2Cblack%2Cred");
    });

    it("should serialize multiple types as comma-delimited", () => {
      const params = releaseFiltersToSearchParams({
        types: ["single", "ep", "album"],
      });
      expect(params.toString()).toBe("type=single%2Cep%2Calbum");
    });

    it("should serialize multiple artists as comma-delimited", () => {
      const params = releaseFiltersToSearchParams({
        artistIds: ["dyson-hope", "nototo"],
      });
      expect(params.toString()).toBe("artist=dyson-hope%2Cnototo");
    });

    it("should serialize multiple genres as comma-delimited", () => {
      const params = releaseFiltersToSearchParams({
        genres: ["techno", "house"],
      });
      expect(params.toString()).toBe("genre=techno%2Chouse");
    });

    it("should serialize multiple moods as comma-delimited", () => {
      const params = releaseFiltersToSearchParams({
        moods: ["dark", "peak-time"],
      });
      expect(params.toString()).toBe("mood=dark%2Cpeak-time");
    });

    it("should serialize year", () => {
      const params = releaseFiltersToSearchParams({ year: 2024 });
      expect(params.toString()).toBe("year=2024");
    });

    it("should serialize BPM range", () => {
      const params = releaseFiltersToSearchParams({
        bpmMin: 120,
        bpmMax: 140,
      });
      const str = params.toString();
      expect(str).toContain("bpmMin=120");
      expect(str).toContain("bpmMax=140");
    });

    it("should serialize only min BPM if max is not set", () => {
      const params = releaseFiltersToSearchParams({ bpmMin: 120 });
      expect(params.toString()).toBe("bpmMin=120");
    });

    it("should serialize only max BPM if min is not set", () => {
      const params = releaseFiltersToSearchParams({ bpmMax: 140 });
      expect(params.toString()).toBe("bpmMax=140");
    });

    it("should serialize multiple keys as comma-delimited", () => {
      const params = releaseFiltersToSearchParams({
        keys: ["F minor | 4A", "C major | 8B"],
      });
      const str = params.toString();
      expect(str).toContain("key=");
      expect(str).toContain("F");
      expect(str).toContain("minor");
      expect(str).toContain("4A");
      expect(str).toContain("C");
      expect(str).toContain("major");
      expect(str).toContain("8B");
    });

    it("should serialize all filters combined", () => {
      const filters: ReleaseFilterCriteria = {
        query: "rhythm",
        seriesIds: ["core", "black"],
        types: ["ep"],
        artistIds: ["dyson-hope"],
        genres: ["techno", "house"],
        moods: ["dark"],
        year: 2024,
        bpmMin: 120,
        bpmMax: 140,
        keys: ["F minor | 4A"],
      };
      const params = releaseFiltersToSearchParams(filters);
      const str = params.toString();
      expect(str).toContain("q=rhythm");
      expect(str).toContain("series=core%2Cblack");
      expect(str).toContain("type=ep");
      expect(str).toContain("artist=dyson-hope");
      expect(str).toContain("genre=techno%2Chouse");
      expect(str).toContain("mood=dark");
      expect(str).toContain("year=2024");
      expect(str).toContain("bpmMin=120");
      expect(str).toContain("bpmMax=140");
      expect(str).toContain("key=");
      expect(str).toContain("F");
      expect(str).toContain("minor");
      expect(str).toContain("4A");
    });

    it("should not include empty arrays in params", () => {
      const params = releaseFiltersToSearchParams({
        seriesIds: [],
        types: [],
        genres: [],
      });
      expect(params.toString()).toBe("");
    });

    it("should not include undefined values in params", () => {
      const params = releaseFiltersToSearchParams({
        query: undefined,
        year: undefined,
        bpmMin: undefined,
        bpmMax: undefined,
      });
      expect(params.toString()).toBe("");
    });
  });

  describe("searchParamsToReleaseFilters", () => {
    it("should parse empty params to empty filters", () => {
      const params = new URLSearchParams("");
      const filters = searchParamsToReleaseFilters(params);
      expect(filters).toEqual({});
    });

    it("should parse query parameter", () => {
      const params = new URLSearchParams("q=rhythm");
      const filters = searchParamsToReleaseFilters(params);
      expect(filters.query).toBe("rhythm");
    });

    it("should parse single series", () => {
      const params = new URLSearchParams("series=core");
      const filters = searchParamsToReleaseFilters(params);
      expect(filters.seriesIds).toEqual(["core"]);
    });

    it("should parse multiple comma-delimited series", () => {
      const params = new URLSearchParams("series=core,black,red");
      const filters = searchParamsToReleaseFilters(params);
      expect(filters.seriesIds).toEqual(["core", "black", "red"]);
    });

    it("should parse multiple comma-delimited types", () => {
      const params = new URLSearchParams("type=single,ep,album");
      const filters = searchParamsToReleaseFilters(params);
      expect(filters.types).toEqual(["single", "ep", "album"]);
    });

    it("should parse multiple comma-delimited artists", () => {
      const params = new URLSearchParams("artist=dyson-hope,nototo");
      const filters = searchParamsToReleaseFilters(params);
      expect(filters.artistIds).toEqual(["dyson-hope", "nototo"]);
    });

    it("should parse multiple comma-delimited genres", () => {
      const params = new URLSearchParams("genre=techno,house");
      const filters = searchParamsToReleaseFilters(params);
      expect(filters.genres).toEqual(["techno", "house"]);
    });

    it("should parse multiple comma-delimited moods", () => {
      const params = new URLSearchParams("mood=dark,peak-time");
      const filters = searchParamsToReleaseFilters(params);
      expect(filters.moods).toEqual(["dark", "peak-time"]);
    });

    it("should parse year as number", () => {
      const params = new URLSearchParams("year=2024");
      const filters = searchParamsToReleaseFilters(params);
      expect(filters.year).toBe(2024);
    });

    it("should parse BPM range", () => {
      const params = new URLSearchParams("bpmMin=120&bpmMax=140");
      const filters = searchParamsToReleaseFilters(params);
      expect(filters.bpmMin).toBe(120);
      expect(filters.bpmMax).toBe(140);
    });

    it("should parse only min BPM", () => {
      const params = new URLSearchParams("bpmMin=120");
      const filters = searchParamsToReleaseFilters(params);
      expect(filters.bpmMin).toBe(120);
      expect(filters.bpmMax).toBeUndefined();
    });

    it("should parse only max BPM", () => {
      const params = new URLSearchParams("bpmMax=140");
      const filters = searchParamsToReleaseFilters(params);
      expect(filters.bpmMin).toBeUndefined();
      expect(filters.bpmMax).toBe(140);
    });

    it("should parse multiple comma-delimited keys", () => {
      const params = new URLSearchParams("key=F%20minor%20%7C%204A,C%20major%20%7C%208B");
      const filters = searchParamsToReleaseFilters(params);
      expect(filters.keys).toEqual(["F minor | 4A", "C major | 8B"]);
    });

    it("should parse all params combined", () => {
      const params = new URLSearchParams(
        "q=rhythm&series=core,black&type=ep&artist=dyson-hope&genre=techno,house&mood=dark&year=2024&bpmMin=120&bpmMax=140&key=F%20minor%20%7C%204A"
      );
      const filters = searchParamsToReleaseFilters(params);
      expect(filters.query).toBe("rhythm");
      expect(filters.seriesIds).toEqual(["core", "black"]);
      expect(filters.types).toEqual(["ep"]);
      expect(filters.artistIds).toEqual(["dyson-hope"]);
      expect(filters.genres).toEqual(["techno", "house"]);
      expect(filters.moods).toEqual(["dark"]);
      expect(filters.year).toBe(2024);
      expect(filters.bpmMin).toBe(120);
      expect(filters.bpmMax).toBe(140);
      expect(filters.keys).toEqual(["F minor | 4A"]);
    });

    it("should filter out empty strings from comma-delimited values", () => {
      const params = new URLSearchParams("genre=techno,,house,");
      const filters = searchParamsToReleaseFilters(params);
      expect(filters.genres).toEqual(["techno", "house"]);
    });

    it("should handle missing optional params gracefully", () => {
      const params = new URLSearchParams("q=test");
      const filters = searchParamsToReleaseFilters(params);
      expect(filters.query).toBe("test");
      expect(filters.seriesIds).toBeUndefined();
      expect(filters.types).toBeUndefined();
      expect(filters.bpmMin).toBeUndefined();
      expect(filters.bpmMax).toBeUndefined();
    });
  });

  describe("Round-trip serialization (Releases)", () => {
    it("should round-trip empty filters", () => {
      const original: ReleaseFilterCriteria = {};
      const params = releaseFiltersToSearchParams(original);
      const restored = searchParamsToReleaseFilters(params);
      expect(restored).toEqual(original);
    });

    it("should round-trip complex filters", () => {
      const original: ReleaseFilterCriteria = {
        query: "rhythm",
        seriesIds: ["core", "black"],
        types: ["ep"],
        artistIds: ["dyson-hope"],
        genres: ["techno", "house"],
        moods: ["dark"],
        year: 2024,
        bpmMin: 120,
        bpmMax: 140,
        keys: ["F minor | 4A"],
      };
      const params = releaseFiltersToSearchParams(original);
      const restored = searchParamsToReleaseFilters(params);
      expect(restored).toEqual(original);
    });

    it("should preserve filter order in round-trip", () => {
      const original: ReleaseFilterCriteria = {
        artistIds: ["dyson-hope", "nototo", "b-squared"],
        genres: ["techno", "house", "deep-house"],
      };
      const params = releaseFiltersToSearchParams(original);
      const restored = searchParamsToReleaseFilters(params);
      expect(restored.artistIds).toEqual(original.artistIds);
      expect(restored.genres).toEqual(original.genres);
    });
  });
});
