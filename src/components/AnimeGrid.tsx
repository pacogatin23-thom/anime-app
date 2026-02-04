import type { AnimeItem } from "../types/anime.types";
import AnimeCard from "./AnimeCard";

interface AnimeGridProps {
  animes: AnimeItem[];
  favs: Set<string>;
  seen: Set<string>;
  onToggleFav: (anime: AnimeItem) => void;
  onToggleSeen: (anime: AnimeItem) => void;
  onOpenTrailer: (anime: AnimeItem) => void;
}

export default function AnimeGrid({ animes, favs, seen, onToggleFav, onToggleSeen, onOpenTrailer }: AnimeGridProps) {
  return (
    <section className="grid">
      {animes.map((a) => (
        <AnimeCard
          key={a.id as string}
          anime={a}
          favs={favs}
          seen={seen}
          onToggleFav={onToggleFav}
          onToggleSeen={onToggleSeen}
          onOpenTrailer={onOpenTrailer}
        />
      ))}
    </section>
  );
}
