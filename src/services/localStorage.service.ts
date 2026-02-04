import { safeJsonParse } from "../utils/dataExtractor";

export function loadSet(key: string): Set<string> {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return new Set<string>();
    const parsed = safeJsonParse(raw);
    if (!Array.isArray(parsed)) return new Set<string>();
    return new Set<string>(parsed.map((x) => String(x)));
  } catch {
    return new Set<string>();
  }
}

export function saveSet(key: string, set: Set<string>): void {
  try {
    localStorage.setItem(key, JSON.stringify(Array.from(set)));
  } catch {
    /* ignore (quota / privado) */
  }
}
