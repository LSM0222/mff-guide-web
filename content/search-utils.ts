export function normalizeSearch(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

export const searchScopes = ["title", "all", "body"] as const;

export type SearchScope = (typeof searchScopes)[number];

export function normalizeSearchScope(value: unknown): SearchScope {
  return typeof value === "string" && searchScopes.includes(value as SearchScope) ? (value as SearchScope) : "title";
}
