import { useState } from "react";
import type { AnimeItem } from "../types/anime.types";
import { LS_FAV, LS_SEEN, LS_DISLIKED } from "../constants/storage";
import { loadSet, saveSet } from "../services/localStorage.service";
import { getKey } from "../utils/animeGetters";

export function useAnimeStorage() {
  const [favs, setFavs] = useState<Set<string>>(() => loadSet(LS_FAV));
  const [seen, setSeen] = useState<Set<string>>(() => loadSet(LS_SEEN));
  const [disliked, setDisliked] = useState<Set<string>>(() => loadSet(LS_DISLIKED));

  function toggleFav(a: AnimeItem): void {
    const key = getKey(a);
    const next = new Set(favs);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setFavs(next);
    saveSet(LS_FAV, next);
  }

  function toggleSeen(a: AnimeItem): void {
    const key = getKey(a);
    const next = new Set(seen);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setSeen(next);
    saveSet(LS_SEEN, next);
  }

  function toggleDisliked(a: AnimeItem): void {
    const key = getKey(a);
    const next = new Set(disliked);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setDisliked(next);
    saveSet(LS_DISLIKED, next);
  }

  return {
    favs,
    seen,
    disliked,
    toggleFav,
    toggleSeen,
    toggleDisliked,
  };
}
