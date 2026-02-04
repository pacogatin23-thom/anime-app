import type { AnimeItem } from "../types/anime.types";
import { isRec } from "./typeGuards";

export function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

export function extractAnimeArray(data: unknown): AnimeItem[] {
  if (Array.isArray(data)) return data.filter(isRec);

  if (isRec(data)) {
    const a1 = data["animes"];
    if (Array.isArray(a1)) return a1.filter(isRec);

    const a2 = data["results"];
    if (Array.isArray(a2)) return a2.filter(isRec);

    const a3 = data["data"];
    if (Array.isArray(a3)) return a3.filter(isRec);
  }

  return [];
}
