import type { SortMode } from "../types/app.types";

interface HeaderProps {
  topRef: React.RefObject<HTMLDivElement>;
  animes: { length: number };
  loading: boolean;
  onlyFavs: boolean;
  setOnlyFavs: (value: boolean | ((prev: boolean) => boolean)) => void;
  setRecOpen: (value: boolean) => void;
  setAvoidOpen: (value: boolean) => void;
  q: string;
  setQ: (value: string) => void;
  fromYear: number;
  setFromYear: (value: number) => void;
  toYear: number;
  setToYear: (value: number) => void;
  genre: string;
  setGenre: (value: string) => void;
  type: string;
  setType: (value: string) => void;
  sort: SortMode;
  setSort: (value: SortMode) => void;
  yearRange: { min: number; max: number };
  yearOptions: number[];
  genreOptions: string[];
  typeOptions: string[];
  onRandomPick: () => void;
  onNavigateToBlog: () => void;
}

export default function Header({
  topRef,
  animes,
  loading,
  onlyFavs,
  setOnlyFavs,
  setRecOpen,
  setAvoidOpen,
  q,
  setQ,
  fromYear,
  setFromYear,
  toYear,
  setToYear,
  genre,
  setGenre,
  type,
  setType,
  sort,
  setSort,
  yearRange,
  yearOptions,
  genreOptions,
  typeOptions,
  onRandomPick,
  onNavigateToBlog,
}: HeaderProps) {
  return (
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
          <button className="secondary" onClick={onNavigateToBlog}>
            Blog
          </button>
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

        <button onClick={onRandomPick}>Random</button>
      </div>
    </header>
  );
}
