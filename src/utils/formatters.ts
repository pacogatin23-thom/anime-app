import { asNullableNumber } from "./parsers";

export function stripHtml(s: string): string {
  return s
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function show(v: unknown): string {
  if (v === null || v === undefined) return "No disponible";
  if (typeof v === "string") return v.trim().length ? v : "No disponible";
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : "No disponible";
  if (Array.isArray(v)) return v.length ? v.join(", ") : "No disponible";
  return "No disponible";
}

export function showPct(v: unknown): string {
  const n = asNullableNumber(v);
  if (n === null) return "No disponible";
  return `${Math.round(n)}%`;
}
