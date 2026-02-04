export type Rec = Record<string, unknown>;
export type AnimeItem = Rec;

/** ========= NUEVO: lectura segura de meta (sin romper) ========= */
export type AnimeMeta = {
  filler?: {
    canonEpisodes?: number | null;
    fillerEpisodes?: number | null;
    mixedEpisodes?: number | null;
    totalEpisodesVerified?: number | null;
    note?: string | null;
    sourceUrl?: string | null;
  };
  seasons?: {
    totalSeasons?: number | null;
    note?: string | null;
    sourceUrl?: string | null;
  };
  manga?: {
    volumes?: number | null;
    chapters?: number | null;
    note?: string | null;
    sourceUrl?: string | null;
  };
  adaptation?: {
    mangaChaptersAdapted?: number | null;
    animeEpisodes?: number | null;
    differencePercent?: number | null;
    summary?: string | null;
    sourceUrl?: string | null;
  };
  studio?: {
    studios?: string[];
    sourceUrl?: string | null;
  };
  creator?: {
    name?: string | null;
    role?: string | null;
    sourceUrl?: string | null;
  };
};
