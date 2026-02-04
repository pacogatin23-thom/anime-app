// scripts/enrich-meta.mjs
import fs from "fs/promises";

const FILE = "public/data/animes.json";
const SLEEP_MS = 350;
const ALLOWED_TYPES = new Set(["TV", "Película"]); // NO OVA

const TARGETS = [
  { key: "Naruto", q: "Naruto", type: "ANIME", format: "TV", year: 2002 },
  { key: "One Piece", q: "One Piece", type: "ANIME", format: "TV", year: 1999 },
  { key: "Bleach", q: "Bleach", type: "ANIME", format: "TV", year: 2004 },
  { key: "Hunter x Hunter (2011)", q: "Hunter x Hunter", type: "ANIME", format: "TV", year: 2011 },
  { key: "Fullmetal Alchemist: Brotherhood", q: "Fullmetal Alchemist: Brotherhood", type: "ANIME", format: "TV", year: 2009 },
];

const querySearch = `
query ($search: String, $type: MediaType, $format: MediaFormat, $seasonYear: Int) {
  Page(perPage: 10) {
    media(search: $search, type: $type, format: $format, seasonYear: $seasonYear) {
      id
      title { romaji english native }
      seasonYear
      format
      siteUrl
      studios(isMain: true) { nodes { name } }
      staff(perPage: 50) { edges { role node { name { full } } } }
      relations { nodes { type volumes chapters } }
    }
  }
}
`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function norm(s) {
  return String(s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function bestTitle(media) {
  return media?.title?.english || media?.title?.romaji || media?.title?.native || "";
}

function pickCreator(edges = []) {
  const wanted = ["Original Creator", "Original Story", "Original Work", "Creator", "Story"];
  for (const w of wanted) {
    const hit = edges.find(e => norm(e?.role || "").includes(norm(w)));
    if (hit?.node?.name?.full) return { name: hit.node.name.full, role: hit.role ?? null, sourceUrl: null };
  }
  const first = edges.find(e => e?.node?.name?.full);
  return first?.node?.name?.full
    ? { name: first.node.name.full, role: first.role ?? "Staff", sourceUrl: null }
    : { name: null, role: null, sourceUrl: null };
}

function pickManga(relNodes = []) {
  const manga = relNodes.find(n => n?.type === "MANGA" && (n?.volumes || n?.chapters));
  return manga
    ? { volumes: manga.volumes ?? null, chapters: manga.chapters ?? null, note: null, sourceUrl: null }
    : { volumes: null, chapters: null, note: null, sourceUrl: null };
}

function wipeSourceUrls(meta) {
  if (!meta || typeof meta !== "object") return meta;
  const walk = (obj) => {
    if (!obj || typeof obj !== "object") return;
    for (const k of Object.keys(obj)) {
      if (k === "sourceUrl") obj[k] = null;
      else walk(obj[k]);
    }
  };
  walk(meta);
  return meta;
}

async function anilistSearch({ q, type, format, year }) {
  const res = await fetch("https://graphql.anilist.co", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      query: querySearch,
      variables: { search: q, type, format, seasonYear: year },
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AniList HTTP ${res.status}: ${text.slice(0, 200)}`);
  }
  const json = await res.json();
  if (json.errors?.length) throw new Error(json.errors[0].message);
  return json.data?.Page?.media ?? [];
}

function findInLocal(arr, titleKey) {
  const key = norm(titleKey);
  const candidates = arr
    .filter(a => ALLOWED_TYPES.has(String(a?.tipo ?? "").trim()))
    .filter(a => norm(a?.titulo).includes(key));

  if (!candidates.length) return null;
  // Elegimos el que tenga más episodios (suele ser la serie principal)
  return candidates.sort((x,y) => (Number(y.episodios)||0) - (Number(x.episodios)||0))[0];
}

async function main() {
  const raw = await fs.readFile(FILE, "utf8");
  const arr = JSON.parse(raw);

  // 1) borrar meta en OVA (como pediste)
  for (const a of arr) {
    if (String(a?.tipo ?? "").trim() === "OVA" && a.meta) delete a.meta;
  }

  let updated = 0;

  for (const t of TARGETS) {
    const local = findInLocal(arr, t.q);
    if (!local) {
      console.log(`NO ENCONTRADO en tu JSON (TV/Película): ${t.key}`);
      continue;
    }

    let list = [];
    try {
      list = await anilistSearch(t);
    } catch (e) {
      console.log(`FALLO AniList (${t.key}) -> ${e.message}`);
      await sleep(SLEEP_MS);
      continue;
    }

    // Elegimos el primer resultado (ya filtramos por year/format)
    const media = list[0];
    if (!media) {
      console.log(`AniList no devolvió match (${t.key})`);
      await sleep(SLEEP_MS);
      continue;
    }

    const studios = (media.studios?.nodes || []).map(s => s.name).filter(Boolean);

    local.meta = {
      studio: { studios: studios.length ? studios : null, sourceUrl: null },
      creator: pickCreator(media.staff?.edges || []),
      seasons: { totalSeasons: null, note: null, sourceUrl: null },
      manga: pickManga(media.relations?.nodes || []),
      filler: { canonEpisodes: null, fillerEpisodes: null, mixedEpisodes: null, totalEpisodesVerified: local.episodios ?? null, note: null, sourceUrl: null },
      adaptation: { mangaChaptersAdapted: null, animeEpisodes: local.episodios ?? null, differencePercent: null, summary: null, sourceUrl: null }
    };

    wipeSourceUrls(local.meta);

    updated++;
    console.log(`OK: ${t.key} -> meta agregado (AniList: ${bestTitle(media)})`);
    await sleep(SLEEP_MS);
  }

  // apaga “fuente” global (por si quedó algo viejo)
  for (const a of arr) if (a.meta) wipeSourceUrls(a.meta);

  await fs.writeFile(FILE, JSON.stringify(arr, null, 2), "utf8");
  console.log(`LISTO: meta agregado a ${updated} items (solo TV/Película).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
