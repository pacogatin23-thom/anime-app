import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import "./styles/App.css";
import type { Rec, AnimeItem, AnimeMeta } from "./types/anime.types";
import type { SortMode } from "./types/app.types";
import { LS_FAV, LS_SEEN, LS_DISLIKED } from "./constants/storage";
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
import { loadSet, saveSet } from "./services/localStorage.service";
import { useDebounced } from "./hooks/useDebounced";
import { useAnimeData } from "./hooks/useAnimeData";

function SourceLink({ url }: { url: string | null | undefined }) {
  if (!url || !isHttpUrl(url)) return null;
  return (
    <span className="metaSource">
      {" "}
      ·{" "}
      <a href={url} target="_blank" rel="noreferrer">
        fuente
      </a>
    </span>
  );
}

export default function App() {
  const { animes, loading } = useAnimeData();

  const [q, setQ] = useState<string>("");
  const qDebounced = useDebounced<string>(q, 250);

  const [genre, setGenre] = useState<string>("todos");
  const [type, setType] = useState<string>("todos");
  const [fromYear, setFromYear] = useState<number>(1990);
  const [toYear, setToYear] = useState<number>(2026);

  const [sort, setSort] = useState<SortMode>("YEAR_DESC");
  const pageSize = 24;
  const [visibleCount, setVisibleCount] = useState<number>(pageSize);

  const [favs, setFavs] = useState<Set<string>>(() => loadSet(LS_FAV));
  const [seen, setSeen] = useState<Set<string>>(() => loadSet(LS_SEEN));
  const [disliked, setDisliked] = useState<Set<string>>(() => loadSet(LS_DISLIKED));
  const [onlyFavs, setOnlyFavs] = useState<boolean>(false);

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
      <header className="top" ref={topRef}>
        <div className="titleRow">
          <div>
            <h1>Que anime queres conocer</h1>
            <p className="subtitle">
              Base cargada: <b>{animes.length.toLocaleString("es-AR")}</b> animes
              {loading ? " (cargando...)" : ""}
            </p>
          </div>

          <div className="topActions">
            <button className="secondary" onClick={() => setOnlyFavs((v) => !v)}>
              {onlyFavs ? "★ Viendo Favoritos" : "☆ Favoritos"}
            </button>
            <button className="secondary" onClick={() => setRecOpen(true)}>
              Ya la vi → Recomendame
            </button>
            <button className="secondary" onClick={() => setAvoidOpen(true)}>
              No me gustó → ¿Qué evitar?
            </button>
          </div>
        </div>

        <div className="controls">
          <label>
            Buscar
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ej: Naruto, One Piece..." />
          </label>

          <label>
            Desde
            <select
              value={String(fromYear)}
              onChange={(e) => {
                const n = Number(e.target.value);
                setFromYear(Number.isFinite(n) ? n : yearRange.min);
              }}
            >
              {yearOptions.map((y) => (
                <option value={y} key={y}>
                  {y}
                </option>
              ))}
            </select>
          </label>

          <label>
            Hasta
            <select
              value={String(toYear)}
              onChange={(e) => {
                const n = Number(e.target.value);
                setToYear(Number.isFinite(n) ? n : yearRange.max);
              }}
            >
              {yearOptions.map((y) => (
                <option value={y} key={y}>
                  {y}
                </option>
              ))}
            </select>
          </label>

          <label>
            Género
            <select value={genre} onChange={(e) => setGenre(e.target.value)}>
              <option value="todos">Todos</option>
              {genreOptions.map((g) => (
                <option value={g} key={g}>
                  {g}
                </option>
              ))}
            </select>
          </label>

          <label>
            Tipo
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="todos">Todos</option>
              {typeOptions.map((t) => (
                <option value={t} key={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>

          <label>
            Ordenar
            <select value={sort} onChange={(e) => setSort(e.target.value as SortMode)}>
              <option value="YEAR_DESC">Año (nuevo → viejo)</option>
              <option value="YEAR_ASC">Año (viejo → nuevo)</option>
              <option value="AZ">A-Z</option>
              <option value="EPS_DESC">Episodios (↓)</option>
              <option value="EPS_ASC">Episodios (↑)</option>
            </select>
          </label>

          <button onClick={randomPick}>Random</button>
        </div>
      </header>

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

        <section className="grid">
          {visible.map((a) => {
            const key = getKey(a);
            const title = getTitle(a);
            const cover = getCoverUrl(a);
            const year = getYear(a);
            const tipoStr = getType(a);
            const eps = getEpisodes(a);
            const genres = getGenres(a).slice(0, 4);
            const moods = getMood(a).slice(0, 2);
            const siteUrl = getSiteUrl(a);

            const meta = getMeta(a);

            return (
              <article className="card" key={key}>
                <div className={`cover ${cover.length === 0 ? "noimg" : ""}`}>
                  {cover.length > 0 ? (
                    <img
                      src={cover}
                      alt={title}
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        e.currentTarget.parentElement?.classList.add("noimg");
                      }}
                    />
                  ) : null}
                  <div className="noCover">Sin portada</div>
                </div>

                <div className="cardTop">
                  <h3 title={title}>{title}</h3>

                  <div className="cardBtns">
                    <button className={`icon ${favs.has(key) ? "on" : ""}`} onClick={() => toggleFav(a)} title="Favorito">
                      {favs.has(key) ? "♥" : "♡"}
                    </button>
                    <button className={`icon ${seen.has(key) ? "onSeen" : ""}`} onClick={() => toggleSeen(a)} title="Marcar como vista">
                      {seen.has(key) ? "✓" : "○"}
                    </button>
                  </div>
                </div>

                <div className="meta">
                  <span>{year > 0 ? String(year) : "—"}</span>
                  <span>{tipoStr}</span>
                  <span>{eps > 0 ? `${eps} eps` : "—"}</span>
                </div>

                <div className="tags">
                  {genres.map((g) => (
                    <span className="tag tag-accent" key={`${key}-g-${g}`}>
                      {g}
                    </span>
                  ))}
                  {moods.map((m) => (
                    <span className="tag tag-cyan" key={`${key}-m-${m}`}>
                      {m}
                    </span>
                  ))}
                </div>

                <p className="desc">{getSynopsis(a)}</p>

                {/* ✅ NUEVO: Detalles enriquecidos (con fallbacks) */}
                <div className="detailsBox">
                  <div className="detailsTitle">Detalles</div>

                  <div className="detailsRow">
                    <b>Relleno:</b>{" "}
                    {meta?.filler
                      ? `Canon ${show(meta.filler.canonEpisodes)} · Filler ${show(meta.filler.fillerEpisodes)} · Mixtos ${show(
                          meta.filler.mixedEpisodes
                        )}`
                      : "No disponible"}
                    <SourceLink url={meta?.filler?.sourceUrl} />
                  </div>

                  <div className="detailsRow">
                    <b>Temporadas:</b> {meta?.seasons ? show(meta.seasons.totalSeasons) : "No disponible"}
                    <SourceLink url={meta?.seasons?.sourceUrl} />
                  </div>

                  <div className="detailsRow">
                    <b>Manga:</b>{" "}
                    {meta?.manga ? `Tomos ${show(meta.manga.volumes)} · Capítulos ${show(meta.manga.chapters)}` : "No disponible"}
                    <SourceLink url={meta?.manga?.sourceUrl} />
                  </div>

                  <div className="detailsRow">
                    <b>Manga vs Anime:</b>{" "}
                    {meta?.adaptation
                      ? `Capítulos adaptados ${show(meta.adaptation.mangaChaptersAdapted)} · Diferencia ${showPct(
                          meta.adaptation.differencePercent
                        )}`
                      : "No disponible"}
                    <SourceLink url={meta?.adaptation?.sourceUrl} />
                  </div>

                  <div className="detailsRow">
                    <b>Estudio:</b> {meta?.studio ? show(meta.studio.studios ?? []) : "No disponible"}
                    <SourceLink url={meta?.studio?.sourceUrl} />
                  </div>

                  <div className="detailsRow">
                    <b>Creador:</b>{" "}
                    {meta?.creator ? `${show(meta.creator.name)}${meta.creator.role ? ` (${show(meta.creator.role)})` : ""}` : "No disponible"}
                    <SourceLink url={meta?.creator?.sourceUrl} />
                  </div>
                </div>

                <div className="cardActions">
                  <button className="secondary" onClick={() => openTrailer(a)}>
                    Ver trailer
                  </button>
                  {siteUrl.length > 0 ? (
                    <a className="linkBtn" href={siteUrl} target="_blank" rel="noreferrer">
                      Ver info
                    </a>
                  ) : null}
                </div>
              </article>
            );
          })}
        </section>
      </main>

      {trailerId.length > 0 ? (
        <div className="modalOverlay" role="dialog" aria-modal="true" onMouseDown={closeTrailer}>
          <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="modalHead">
              <div className="modalTitle">{trailerTitle}</div>
              <button className="secondary" onClick={closeTrailer}>
                Cerrar
              </button>
            </div>
            <div className="videoWrap">
              <iframe
                src={`https://www.youtube.com/embed/${trailerId}?autoplay=1`}
                title="Trailer"
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      ) : null}

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
                            const next = new Set(disliked);
                            next.add(k);
                            setDisliked(next);
                            saveSet(LS_DISLIKED, next);
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
