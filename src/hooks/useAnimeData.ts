import { useEffect, useState } from "react";
import type { AnimeItem } from "../types/anime.types";
import { safeJsonParse, extractAnimeArray } from "../utils/dataExtractor";

export function useAnimeData() {
  const [animes, setAnimes] = useState<AnimeItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const load = async (): Promise<void> => {
      setLoading(true);
      try {
        const r = await fetch("/data/animes.json", { cache: "no-store" });
        const text = await r.text();
        const data = safeJsonParse(text);
        const arr = extractAnimeArray(data);
        setAnimes(arr);
      } catch {
        setAnimes([]);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  return { animes, loading };
}
