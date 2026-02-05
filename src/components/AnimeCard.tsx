import { useState, useEffect } from "react";
import type { AnimeItem } from "../types/anime.types";
import {
  getKey,
  getTitle,
  getCoverUrl,
  getYear,
  getType,
  getEpisodes,
  getGenres,
  getMood,
  getSynopsis,
  getSiteUrl,
  getMeta,
} from "../utils/animeGetters";
import { show, showPct } from "../utils/formatters";
import SourceLink from "./SourceLink";

interface AnimeCardProps {
  anime: AnimeItem;
  favs: Set<string>;
  seen: Set<string>;
  onToggleFav: (anime: AnimeItem) => void;
  onToggleSeen: (anime: AnimeItem) => void;
  onOpenTrailer: (anime: AnimeItem) => void;
}

export default function AnimeCard({ anime: a, favs, seen, onToggleFav, onToggleSeen, onOpenTrailer }: AnimeCardProps) {
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

  const [rating, setRating] = useState<number>(0);

  useEffect(() => {
    const storageKey = `animeRating:${key}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (parsed >= 1 && parsed <= 5) {
        setRating(parsed);
      }
    }
  }, [key]);

  const handleRating = (stars: number) => {
    setRating(stars);
    const storageKey = `animeRating:${key}`;
    localStorage.setItem(storageKey, String(stars));
  };

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
          <button className={`icon ${favs.has(key) ? "on" : ""}`} onClick={() => onToggleFav(a)} title="Favorito">
            {favs.has(key) ? "♥" : "♡"}
          </button>
          <button className={`icon ${seen.has(key) ? "onSeen" : ""}`} onClick={() => onToggleSeen(a)} title="Marcar como vista">
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

      {/* Rating con estrellas */}
      <div className="ratingBox">
        <span className="ratingLabel">Tu puntuación:</span>
        <div className="stars">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              className={`starBtn ${star <= rating ? "filled" : ""}`}
              onClick={() => handleRating(star)}
              title={`${star} estrella${star > 1 ? "s" : ""}`}
            >
              ⭐
            </button>
          ))}
        </div>
      </div>

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
        <button className="secondary" onClick={() => onOpenTrailer(a)}>
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
}
