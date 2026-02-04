import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import "./styles/App.css";
import type { Rec, AnimeItem, AnimeMeta } from "./types/anime.types";
import type { SortMode } from "./types/app.types";
import { isRec, isHttpUrl } from "./utils/typeGuards";
import { asString, asNumber, asNullableNumber, asStringArray } from "./utils/parsers";
import { stripHtml, show, showPct } from "./utils/formatters";
import { safeJsonParse, extractAnimeArray } from "./utils/dataExtractor";
import {
  getTitle,
  getYear,
  getType,
  getEpisodes,
  getGenres,
  getMood,
  getSynopsis,
  getSiteUrl,
  getTrailerId,
  getCoverUrl,
  getKey,
  getMeta,
} from "./utils/animeGetters";
import { useDebounced } from "./hooks/useDebounced";
import { useAnimeData } from "./hooks/useAnimeData";
import { useAnimeStorage } from "./hooks/useAnimeStorage";
import { useAnimeFilters } from "./hooks/useAnimeFilters";
import Header from "./components/Header";
import AnimeGrid from "./components/AnimeGrid";
import TrailerModal from "./components/TrailerModal";
import RecommendationModal from "./components/RecommendationModal";
import AvoidModal from "./components/AvoidModal";

export default function App() {
  const { animes, loading } = useAnimeData();
  const { favs, seen, disliked, toggleFav, toggleSeen, toggleDisliked } = useAnimeStorage();
  const {
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
    yearRange,
    yearOptions,
    genreOptions,
    typeOptions,
    filtered,
    visible,
    pageSize,
  } = useAnimeFilters({ animes, favs });

  const [trailerId, setTrailerId] = useState<string>("");
  const [trailerTitle, setTrailerTitle] = useState<string>("");

  const [recOpen, setRecOpen] = useState<boolean>(false);

  // modal de "No me gustó → ¿Qué evitar?"
  const [avoidOpen, setAvoidOpen] = useState<boolean>(false);

  const topRef = useRef<HTMLDivElement | null>(null);

  function openTrailer(a: AnimeItem): void {
    const id = getTrailerId(a);
    if (id.length > 0) {
      setTrailerId(id);
      setTrailerTitle(getTitle(a));
      return;
    }
    const qq = encodeURIComponent(`${getTitle(a)} trailer`);
    window.open(`https://www.youtube.com/results?search_query=${qq}`, "_blank", "noopener,noreferrer");
  }

  function closeTrailer(): void {
    setTrailerId("");
    setTrailerTitle("");
  }

  function randomPick(): void {
    if (filtered.length === 0) return;
    const a = filtered[Math.floor(Math.random() * filtered.length)];
    setQ(getTitle(a));
    topRef.current?.scrollIntoView({ behavior: "smooth" });
  }



  return (
    <div className="page">
      <Header
        topRef={topRef}
        animes={animes}
        loading={loading}
        onlyFavs={onlyFavs}
        setOnlyFavs={setOnlyFavs}
        setRecOpen={setRecOpen}
        setAvoidOpen={setAvoidOpen}
        q={q}
        setQ={setQ}
        fromYear={fromYear}
        setFromYear={setFromYear}
        toYear={toYear}
        setToYear={setToYear}
        genre={genre}
        setGenre={setGenre}
        type={type}
        setType={setType}
        sort={sort}
        setSort={setSort}
        yearRange={yearRange}
        yearOptions={yearOptions}
        genreOptions={genreOptions}
        typeOptions={typeOptions}
        onRandomPick={randomPick}
      />

      <main className="container">
        <div className="pager">
          <p className="counter">
            Mostrando <b>{visible.length}</b> de <b>{filtered.length}</b>
          </p>
          {visible.length < filtered.length ? (
            <button className="secondary" onClick={() => setVisibleCount((v) => v + pageSize)}>
              Ver más
            </button>
          ) : (
            <span />
          )}
        </div>

        <AnimeGrid
          animes={visible}
          favs={favs}
          seen={seen}
          onToggleFav={toggleFav}
          onToggleSeen={toggleSeen}
          onOpenTrailer={openTrailer}
        />
      </main>

      <TrailerModal open={trailerId.length > 0} trailerId={trailerId} title={trailerTitle} onClose={closeTrailer} />

      <RecommendationModal
        open={recOpen}
        onClose={() => setRecOpen(false)}
        animes={animes}
        seen={seen}
        disliked={disliked}
        favs={favs}
        onToggleFav={toggleFav}
        onOpenTrailer={openTrailer}
      />

      {avoidOpen && (
        <AvoidModal
          open={avoidOpen}
          onClose={() => setAvoidOpen(false)}
          animes={animes}
          seen={seen}
          disliked={disliked}
          favs={favs}
          onToggleFav={toggleFav}
          onToggleDisliked={toggleDisliked}
          onOpenTrailer={openTrailer}
        />
      )}
    </div>
  );
}
