// Helpers for storing list/object fields as JSON strings (SQLite has no
// native scalar lists). All callers go through these so swapping to Postgres
// JSON columns later is a one-file change.

export function parseList(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    // tolerate legacy comma-separated values
    return value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
}

export function stringifyList(list: string[] | undefined | null): string {
  return JSON.stringify(list ?? []);
}

export function parseRecord<T = Record<string, number>>(
  value: string | null | undefined,
): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}
