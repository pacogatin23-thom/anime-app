import type { AnimeItem, AnimeMeta } from "../types/anime.types";
import { isRec, isHttpUrl } from "./typeGuards";
import { asString, asNumber, asStringArray } from "./parsers";
import { stripHtml } from "./formatters";

export function getTitle(a: AnimeItem): string {
  const titulo = asString(a["titulo"]);
  if (titulo.length > 0) return titulo;

  const title = a["title"];
  if (typeof title === "string" && title.trim().length > 0) return title.trim();

  if (isRec(title)) {
    const en = asString(title["english"]);
    const ro = asString(title["romaji"]);
    const na = asString(title["native"]);
    if (en.length > 0) return en;
    if (ro.length > 0) return ro;
    if (na.length > 0) return na;
  }

  return "Sin título";
}

export function getYear(a: AnimeItem): number {
  const y1 = asNumber(a["anio"]);
  if (y1 > 0) return y1;

  const y2 = asNumber(a["seasonYear"]);
  if (y2 > 0) return y2;

  const startDate = a["startDate"];
  if (isRec(startDate)) {
    const y3 = asNumber(startDate["year"]);
    if (y3 > 0) return y3;
  }

  return 0;
}

export function getType(a: AnimeItem): string {
  const t1 = asString(a["tipo"]);
  if (t1.length > 0) return t1;

  const t2 = asString(a["format"]);
  if (t2.length > 0) return t2;

  return "—";
}

export function getEpisodes(a: AnimeItem): number {
  const e1 = asNumber(a["episodios"]);
  if (e1 > 0) return e1;

  const e2 = asNumber(a["episodes"]);
  if (e2 > 0) return e2;

  return 0;
}

export function getGenres(a: AnimeItem): string[] {
  const g1 = asStringArray(a["genres"]);
  if (g1.length > 0) return g1;

  const g2 = asStringArray(a["genero"]);
  if (g2.length > 0) return g2;

  // fallback: tags[] -> name
  const tags = a["tags"];
  if (Array.isArray(tags)) {
    const out: string[] = [];
    for (const t of tags) {
      if (isRec(t)) {
        const name = asString(t["name"]);
        if (name.length > 0) out.push(name);
      }
    }
    return out;
  }

  return [];
}

export function getMood(a: AnimeItem): string[] {
  return asStringArray(a["mood"]);
}

export function getSynopsis(a: AnimeItem): string {
  const d1 = asString(a["desc"]);
  if (d1.length > 0) return d1;

  const d2raw = asString(a["description"]);
  if (d2raw.length > 0) return stripHtml(d2raw);

  return "Sin descripción.";
}

export function getSiteUrl(a: AnimeItem): string {
  const u = a["siteUrl"];
  return isHttpUrl(u) ? u : "";
}

export function getTrailerId(a: AnimeItem): string {
  const t = a["trailer"];
  if (!isRec(t)) return "";
  const id = asString(t["id"]);
  const site = asString(t["site"]).toLowerCase();
  return id.length > 0 && site === "youtube" ? id : "";
}

export function getCoverUrl(a: AnimeItem): string {
  const cover = a["cover"];
  if (isHttpUrl(cover)) return cover;

  if (isRec(cover)) {
    const url = cover["url"];
    const xl = cover["extraLarge"];
    const lg = cover["large"];
    const md = cover["medium"];

    if (isHttpUrl(url)) return url;
    if (isHttpUrl(xl)) return xl;
    if (isHttpUrl(lg)) return lg;
    if (isHttpUrl(md)) return md;
  }

  const coverImage = a["coverImage"];
  if (isRec(coverImage)) {
    const xl = coverImage["extraLarge"];
    const lg = coverImage["large"];
    const md = coverImage["medium"];

    if (isHttpUrl(xl)) return xl;
    if (isHttpUrl(lg)) return lg;
    if (isHttpUrl(md)) return md;
  }

  return "";
}

export function getKey(a: AnimeItem): string {
  const id = a["id"];
  if (typeof id === "string" && id.length > 0) return id;
  if (typeof id === "number" && Number.isFinite(id)) return String(id);
  return `${getTitle(a)}-${getYear(a)}-${getType(a)}`.toLowerCase();
}

export function getMeta(a: AnimeItem): AnimeMeta | null {
  const m = a["meta"];
  return isRec(m) ? (m as unknown as AnimeMeta) : null;
}
