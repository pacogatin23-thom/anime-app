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
  const [recPick, setRecPick] = useState<AnimeItem | null>(null);
  const [recQuery, setRecQuery] = useState<string>("");
  const recQueryDebounced = useDebounced<string>(recQuery, 200);

  // modal de “No me gustó → ¿Qué evitar?”
  const [avoidOpen, setAvoidOpen] = useState<boolean>(false);
  const [avoidPick, setAvoidPick] = useState<AnimeItem | null>(null);
  const [avoidQuery, setAvoidQuery] = useState<string>("");
  const avoidQueryDebounced = useDebounced<string>(avoidQuery, 200);

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

  const recommendFrom = useCallback(
    (base: AnimeItem): AnimeItem[] => {
      const baseGenres = new Set(getGenres(base).map((g) => g.toLowerCase()));
      const baseMood = new Set(getMood(base).map((m) => m.toLowerCase()));
      const baseType = getType(base);
      const baseYear = getYear(base);
      const baseKey = getKey(base);

      const scored = animes
        .filter((a) => getKey(a) !== baseKey)
        .filter((a) => !seen.has(getKey(a)))
        .filter((a) => !disliked.has(getKey(a)))
        .map((a) => {
          let score = 0;

          for (const g of getGenres(a)) if (baseGenres.has(g.toLowerCase())) score += 3;
          for (const m of getMood(a)) if (baseMood.has(m.toLowerCase())) score += 2;

          if (getType(a) === baseType) score += 1;

          const dy = Math.abs(getYear(a) - baseYear);
          if (dy <= 1) score += 2;
          else if (dy <= 3) score += 1;

          return { a, score };
        })
        .filter((x) => x.score > 0)
        .sort((x, y) => y.score - x.score)
        .slice(0, 24)
        .map((x) => x.a);

      return scored;
    },
    [animes, seen, disliked]
  );

  const avoidFrom = useCallback(
    (base: AnimeItem): AnimeItem[] => {
      const baseGenres = new Set(getGenres(base).map((g) => g.toLowerCase()));
      const baseMood = new Set(getMood(base).map((m) => m.toLowerCase()));
      const baseType = getType(base);
      const baseYear = getYear(base);
      const baseKey = getKey(base);

      const scored = animes
        .filter((a) => getKey(a) !== baseKey)
        .filter((a) => !seen.has(getKey(a)))
        .map((a) => {
          let score = 0;

          for (const g of getGenres(a)) if (baseGenres.has(g.toLowerCase())) score += 3;
          for (const m of getMood(a)) if (baseMood.has(m.toLowerCase())) score += 2;

          if (getType(a) === baseType) score += 1;

          const dy = Math.abs(getYear(a) - baseYear);
          if (dy <= 1) score += 2;
          else if (dy <= 3) score += 1;

          return { a, score };
        })
        .filter((x) => x.score > 0)
        .sort((x, y) => y.score - x.score)
        .slice(0, 24)
        .map((x) => x.a);

      return scored;
    },
    [animes, seen]
  );

  const recSearchList = useMemo(() => {
    const qq = recQueryDebounced.trim().toLowerCase();
    if (qq.length === 0) return animes.slice(0, 30);
    return animes.filter((a) => getTitle(a).toLowerCase().includes(qq)).slice(0, 30);
  }, [animes, recQueryDebounced]);

  const recResults = useMemo(() => {
    if (recPick === null) return [];
    return recommendFrom(recPick);
  }, [recPick, recommendFrom]);

  const avoidSearchList = useMemo(() => {
    const qq = avoidQueryDebounced.trim().toLowerCase();
    if (qq.length === 0) return animes.slice(0, 30);
    return animes.filter((a) => getTitle(a).toLowerCase().includes(qq)).slice(0, 30);
  }, [animes, avoidQueryDebounced]);

  const avoidResults = useMemo(() => {
    if (avoidPick === null) return [];
    return avoidFrom(avoidPick);
  }, [avoidPick, avoidFrom]);

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

      {recOpen ? (
        <div className="modalOverlay" role="dialog" aria-modal="true" onMouseDown={() => setRecOpen(false)}>
          <div className="modal big" onMouseDown={(e) => e.stopPropagation()}>
            <div className="modalHead">
              <div className="modalTitle">Ya la vi → Recomendame</div>
              <button className="secondary" onClick={() => setRecOpen(false)}>
                Cerrar
              </button>
            </div>

            <div className="recGrid">
              <div className="recLeft">
                <label className="recLabel">
                  Elegí el anime que ya viste
                  <input value={recQuery} onChange={(e) => setRecQuery(e.target.value)} placeholder="Buscar..." />
                </label>

                <div className="recList">
                  {recSearchList.map((a, i) => {
                    const k = getKey(a);
                    const t = getTitle(a);
                    const active = recPick !== null ? getKey(recPick) === k : false;
                    return (
                      <button key={`${k}-${i}`} className={`recItem ${active ? "active" : ""}`} onClick={() => setRecPick(a)}>
                        <span className="recItemTitle">{t}</span>
                        <span className="recItemMeta">
                          {getYear(a) > 0 ? String(getYear(a)) : "—"} • {getType(a)}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <p className="hint">
                  Tip: marcá animes como <b>vistas</b> (✓) para que no te los recomiende. Ahora también podés usar{" "}
                  <b>No me gustó → ¿Qué evitar?</b> para bloquearlos.
                </p>
              </div>

              <div className="recRight">
                {recPick === null ? (
                  <div className="emptyBox">Elegí un anime a la izquierda.</div>
                ) : (
                  <>
                    <div className="recHeader">
                      <div>
                        <div className="recFrom">Basado en:</div>
                        <div className="recPick">{getTitle(recPick)}</div>
                      </div>
                      <button className="secondary" onClick={() => setRecPick(null)}>
                        Cambiar
                      </button>
                    </div>

                    <div className="recCards">
                      {recResults.slice(0, 12).map((a) => {
                        const k = getKey(a);
                        const t = getTitle(a);
                        const cover = getCoverUrl(a);
                        return (
                          <div className="miniCard" key={`rec-${k}`}>
                            <div className={`miniCover ${cover.length === 0 ? "noimg" : ""}`}>
                              {cover.length > 0 ? <img src={cover} alt={t} loading="lazy" /> : null}
                              <div className="noCover">Sin portada</div>
                            </div>
                            <div className="miniBody">
                              <div className="miniTitle" title={t}>
                                {t}
                              </div>
                              <div className="miniMeta">
                                {getYear(a) > 0 ? String(getYear(a)) : "—"} • {getType(a)}
                              </div>
                              <div className="miniBtns">
                                <button className="secondary" onClick={() => openTrailer(a)}>
                                  Trailer
                                </button>
                                <button className="icon" onClick={() => toggleFav(a)} title="Favorito">
                                  {favs.has(k) ? "♥" : "♡"}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {recResults.length === 0 ? <div className="emptyBox">No encontré recomendaciones (probá con otro anime).</div> : null}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {avoidOpen ? (
        <div className="modalOverlay" role="dialog" aria-modal="true" onMouseDown={() => setAvoidOpen(false)}>
          <div className="modal big" onMouseDown={(e) => e.stopPropagation()}>
            <div className="modalHead">
              <div className="modalTitle">No me gustó → ¿Qué evitar?</div>
              <button className="secondary" onClick={() => setAvoidOpen(false)}>
                Cerrar
              </button>
            </div>

            <div className="recGrid">
              <div className="recLeft">
                <label className="recLabel">
                  Elegí el anime que <b>NO</b> te gustó
                  <input value={avoidQuery} onChange={(e) => setAvoidQuery(e.target.value)} placeholder="Buscar..." />
                </label>

                <div className="recList">
                  {avoidSearchList.map((a, i) => {
                    const k = getKey(a);
                    const t = getTitle(a);
                    const active = avoidPick !== null ? getKey(avoidPick) === k : false;

                    return (
                      <button
                        key={`${k}-${i}`}
                        className={`recItem ${active ? "active" : ""}`}
                        onClick={() => {
                          setAvoidPick(a);

                          if (!disliked.has(k)) {
                            toggleDisliked(a);
                          }
                        }}
                      >
                        <span className="recItemTitle">{t}</span>
                        <span className="recItemMeta">
                          {getYear(a) > 0 ? String(getYear(a)) : "—"} • {getType(a)}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <p className="hint">
                  Tip: esto te muestra animes <b>parecidos</b> (géneros, mood, tipo, año) para que sepas qué evitar.
                </p>
              </div>

              <div className="recRight">
                {avoidPick === null ? (
                  <div className="emptyBox">Elegí un anime a la izquierda.</div>
                ) : (
                  <>
                    <div className="recHeader">
                      <div>
                        <div className="recFrom">Si no te gustó:</div>
                        <div className="recPick">{getTitle(avoidPick)}</div>
                      </div>

                      <div style={{ display: "flex", gap: 8 }}>
                        <button className="secondary" onClick={() => toggleDisliked(avoidPick)}>
                          {disliked.has(getKey(avoidPick)) ? "Quitar “No me gustó”" : "Marcar “No me gustó”"}
                        </button>
                        <button className="secondary" onClick={() => setAvoidPick(null)}>
                          Cambiar
                        </button>
                      </div>
                    </div>

                    <div className="recCards">
                      {avoidResults.slice(0, 12).map((a) => {
                        const k = getKey(a);
                        const t = getTitle(a);
                        const cover = getCoverUrl(a);
                        return (
                          <div className="miniCard" key={`avoid-${k}`}>
                            <div className={`miniCover ${cover.length === 0 ? "noimg" : ""}`}>
                              {cover.length > 0 ? <img src={cover} alt={t} loading="lazy" /> : null}
                              <div className="noCover">Sin portada</div>
                            </div>
                            <div className="miniBody">
                              <div className="miniTitle" title={t}>
                                {t}
                              </div>
                              <div className="miniMeta">
                                {getYear(a) > 0 ? String(getYear(a)) : "—"} • {getType(a)}
                              </div>
                              <div className="miniBtns">
                                <button className="secondary" onClick={() => openTrailer(a)}>
                                  Trailer
                                </button>
                                <button className="icon" onClick={() => toggleFav(a)} title="Favorito">
                                  {favs.has(k) ? "♥" : "♡"}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {avoidResults.length === 0 ? <div className="emptyBox">No encontré animes parecidos para evitar (probá con otro).</div> : null}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
