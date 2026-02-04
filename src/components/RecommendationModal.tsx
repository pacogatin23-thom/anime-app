import { useCallback, useMemo, useState } from "react";
import type { AnimeItem } from "../types/anime.types";
import { getKey, getTitle, getYear, getType, getGenres, getMood, getCoverUrl } from "../utils/animeGetters";
import { useDebounced } from "../hooks/useDebounced";

interface RecommendationModalProps {
  open: boolean;
  onClose: () => void;
  animes: AnimeItem[];
  seen: Set<string>;
  disliked: Set<string>;
  favs: Set<string>;
  onToggleFav: (anime: AnimeItem) => void;
  onOpenTrailer: (anime: AnimeItem) => void;
}

export default function RecommendationModal({
  open,
  onClose,
  animes,
  seen,
  disliked,
  favs,
  onToggleFav,
  onOpenTrailer,
}: RecommendationModalProps) {
  const [recPick, setRecPick] = useState<AnimeItem | null>(null);
  const [recQuery, setRecQuery] = useState<string>("");
  const recQueryDebounced = useDebounced<string>(recQuery, 200);

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

  const recSearchList = useMemo(() => {
    const qq = recQueryDebounced.trim().toLowerCase();
    if (qq.length === 0) return animes.slice(0, 30);
    return animes.filter((a) => getTitle(a).toLowerCase().includes(qq)).slice(0, 30);
  }, [animes, recQueryDebounced]);

  const recResults = useMemo(() => {
    if (recPick === null) return [];
    return recommendFrom(recPick);
  }, [recPick, recommendFrom]);

  if (!open) return null;

  return (
    <div className="modalOverlay" role="dialog" aria-modal="true" onMouseDown={onClose}>
      <div className="modal big" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modalHead">
          <div className="modalTitle">Ya la vi → Recomendame</div>
          <button className="secondary" onClick={onClose}>
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
                            <button className="secondary" onClick={() => onOpenTrailer(a)}>
                              Trailer
                            </button>
                            <button className="icon" onClick={() => onToggleFav(a)} title="Favorito">
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
  );
}
