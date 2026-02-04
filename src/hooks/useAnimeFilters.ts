import { useEffect, useMemo, useState } from "react";
import type { AnimeItem } from "../types/anime.types";
import type { SortMode } from "../types/app.types";
import { getYear, getGenres, getType, getTitle, getEpisodes, getKey } from "../utils/animeGetters";
import { useDebounced } from "./useDebounced";

interface UseAnimeFiltersParams {
  animes: AnimeItem[];
  favs: Set<string>;
}

export function useAnimeFilters({ animes, favs }: UseAnimeFiltersParams) {
  const [q, setQ] = useState<string>("");
  const qDebounced = useDebounced<string>(q, 250);

  const [genre, setGenre] = useState<string>("todos");
  const [type, setType] = useState<string>("todos");
  const [fromYear, setFromYear] = useState<number>(1990);
  const [toYear, setToYear] = useState<number>(2026);

  const [sort, setSort] = useState<SortMode>("YEAR_DESC");
  const pageSize = 24;
  const [visibleCount, setVisibleCount] = useState<number>(pageSize);

  const [onlyFavs, setOnlyFavs] = useState<boolean>(false);

  const yearRange = useMemo(() => {
    const years = animes.map(getYear).filter((y) => y > 0);
    const min = years.length > 0 ? Math.min(...years) : 1990;
    const max = years.length > 0 ? Math.max(...years) : 2026;
    return { min, max };
  }, [animes]);

  useEffect(() => {
    if (animes.length === 0) return;
    setFromYear(yearRange.min);
    setToYear(yearRange.max);
  }, [animes.length, yearRange.min, yearRange.max]);

  const yearOptions = useMemo(() => {
    const out: number[] = [];
    for (let y = yearRange.min; y <= yearRange.max; y += 1) out.push(y);
    return out;
  }, [yearRange.min, yearRange.max]);

  const genreOptions = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of animes) {
      for (const g of getGenres(a)) {
        const k = g.toLowerCase();
        map.set(k, (map.get(k) ?? 0) + 1);
      }
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 60)
      .map(([k]) => k);
  }, [animes]);

  const typeOptions = useMemo(() => {
    const set = new Set<string>();
    for (const a of animes) {
      const t = getType(a);
      if (t !== "—") set.add(t);
    }
    return Array.from(set).sort();
  }, [animes]);

  const filtered = useMemo(() => {
    let list = animes;

    if (onlyFavs) list = list.filter((a) => favs.has(getKey(a)));

    if (genre !== "todos") {
      list = list.filter((a) => getGenres(a).map((x) => x.toLowerCase()).includes(genre));
    }

    if (type !== "todos") {
      list = list.filter((a) => getType(a) === type);
    }

    list = list.filter((a) => {
      const y = getYear(a);
      return y > 0 && y >= fromYear && y <= toYear;
    });

    const qq = qDebounced.trim().toLowerCase();
    if (qq.length > 0) {
      list = list.filter((a) => getTitle(a).toLowerCase().includes(qq));
    }

    const sorted = [...list];
    sorted.sort((a, b) => {
      if (sort === "AZ") return getTitle(a).localeCompare(getTitle(b));
      if (sort === "YEAR_DESC") return getYear(b) - getYear(a);
      if (sort === "YEAR_ASC") return getYear(a) - getYear(b);
      if (sort === "EPS_DESC") return getEpisodes(b) - getEpisodes(a);
      if (sort === "EPS_ASC") return getEpisodes(a) - getEpisodes(b);
      return 0;
    });

    return sorted;
  }, [animes, onlyFavs, favs, genre, type, fromYear, toYear, qDebounced, sort]);

  useEffect(() => {
    setVisibleCount(pageSize);
  }, [qDebounced, genre, type, fromYear, toYear, sort, onlyFavs]);

  const visible = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);

  return {
    // Estados y setters
    q,
    setQ,
    genre,
    setGenre,
    type,
    setType,
    fromYear,
    setFromYear,
    toYear,
    setToYear,
    sort,
    setSort,
    onlyFavs,
    setOnlyFavs,
    visibleCount,
    setVisibleCount,
    // Datos computados
    yearRange,
    yearOptions,
    genreOptions,
    typeOptions,
    filtered,
    visible,
    pageSize,
  };
}
