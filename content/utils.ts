import { glossary, guides } from "@/content";
import { guideCategoryDescription, guideCategoryLabel } from "@/content/guide-taxonomy";
import { normalizeSearch } from "@/content/search-utils";

export function categoryLabel(key?: string) {
  return guideCategoryLabel(key);
}

export function categoryDescription(key?: string) {
  return guideCategoryDescription(key);
}

function scoreText(text: string, query: string, title: string) {
  const q = normalizeSearch(query);
  if (!q) return 0;
  const haystack = normalizeSearch(text);
  const normalizedTitle = normalizeSearch(title);
  if (normalizedTitle.includes(q)) return 100;
  if (haystack.includes(q)) return 60;
  const parts = q.split(" ").filter(Boolean);
  if (parts.length > 1 && parts.every((part) => haystack.includes(part))) return 30;
  if (parts.some((part) => part.length > 1 && haystack.includes(part))) return 10;
  return 0;
}

export type SearchResult = {
  type: "공략" | "용어";
  title: string;
  desc: string;
  route: string;
  match: "title" | "body" | "glossary";
  coming?: boolean;
  score: number;
};

export function searchData(query: string): SearchResult[] {
  const q = query.trim();
  if (!q) return [];

  const guideResults: SearchResult[] = guides
    .map((guide) => {
      const searchText = guide.searchText ?? `${guide.title} ${guide.description} ${guide.text}`;
      const score = scoreText(searchText, q, guide.title);
      if (!score) return null;
      const titleMatch = normalizeSearch(guide.title).includes(normalizeSearch(q));
      return {
        type: "공략" as const,
        title: guide.title,
        desc: guide.description,
        route: `/guides/${guide.slug}${titleMatch ? "" : `?q=${encodeURIComponent(q)}`}`,
        match: titleMatch ? ("title" as const) : ("body" as const),
        coming: guide.status === "coming",
        score,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  const glossaryResults: SearchResult[] = glossary
    .map((entry) => {
      const searchText = entry.searchText ?? `${entry.term} ${entry.category} ${entry.text}`;
      const score = scoreText(searchText, q, entry.term);
      if (!score) return null;
      return {
        type: "용어" as const,
        title: entry.term,
        desc: entry.category,
        route: `/glossary?term=${encodeURIComponent(entry.id)}&q=${encodeURIComponent(q)}`,
        match: "glossary" as const,
        score,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  return [...guideResults, ...glossaryResults].sort((a, b) => b.score - a.score).slice(0, 40);
}
