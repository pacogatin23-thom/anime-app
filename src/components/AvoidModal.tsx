import { useCallback, useMemo, useState } from "react";
import type { AnimeItem } from "../types/anime.types";
import { getKey, getTitle, getYear, getType, getGenres, getMood, getCoverUrl } from "../utils/animeGetters";
import { useDebounced } from "../hooks/useDebounced";

interface AvoidModalProps {
  open: boolean;
  onClose: () => void;
  animes: AnimeItem[];
  seen: Set<string>;
  disliked: Set<string>;
  favs: Set<string>;
  onToggleFav: (anime: AnimeItem) => void;
  onToggleDisliked: (anime: AnimeItem) => void;
  onOpenTrailer: (anime: AnimeItem) => void;
}

export default function AvoidModal({
  open,
  onClose,
  animes,
  seen,
  disliked,
  favs,
  onToggleFav,
  onToggleDisliked,
  onOpenTrailer,
}: AvoidModalProps) {
  const [avoidPick, setAvoidPick] = useState<AnimeItem | null>(null);
  const [avoidQuery, setAvoidQuery] = useState<string>("");
  const avoidQueryDebounced = useDebounced<string>(avoidQuery, 200);

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

  const avoidSearchList = useMemo(() => {
    const qq = avoidQueryDebounced.trim().toLowerCase();
    if (qq.length === 0) return animes.slice(0, 30);
    return animes.filter((a) => getTitle(a).toLowerCase().includes(qq)).slice(0, 30);
  }, [animes, avoidQueryDebounced]);

  const avoidResults = useMemo(() => {
    if (avoidPick === null) return [];
    return avoidFrom(avoidPick);
  }, [avoidPick, avoidFrom]);

  if (!open) return null;

  return (
    <div className="modalOverlay" role="dialog" aria-modal="true" onMouseDown={onClose}>
      <div className="modal big" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modalHead">
          <div className="modalTitle">No me gustó → ¿Qué evitar?</div>
          <button className="secondary" onClick={onClose}>
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
                        onToggleDisliked(a);
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
                    <button className="secondary" onClick={() => onToggleDisliked(avoidPick)}>
                      {disliked.has(getKey(avoidPick)) ? 'Quitar "No me gustó"' : 'Marcar "No me gustó"'}
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

                  {avoidResults.length === 0 ? <div className="emptyBox">No encontré animes parecidos para evitar (probá con otro).</div> : null}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
