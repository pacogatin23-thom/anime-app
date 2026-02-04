import type { Rec } from "../types/anime.types";

export function isRec(v: unknown): v is Rec {
  return typeof v === "object" && v !== null;
}

export function isHttpUrl(v: unknown): v is string {
  return typeof v === "string" && /^https?:\/\//i.test(v);
}
