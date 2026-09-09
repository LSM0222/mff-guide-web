export function normalizeSearch(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}
