import type { GlossaryEntry, Guide, UpdateItem, UsefulLink } from "@/content/types";
import { categoryMeta, homeSections } from "@/content/site";
import { normalizeSearch } from "@/content/search-utils";
import { sanityReadClient, sanityRevalidate } from "@/sanity/lib/client";
import { allGuidesQuery, glossaryQuery, guideBySlugQuery, siteSettingsQuery } from "@/sanity/lib/queries";
import { blocksToText, renderBlocks, renderGuideHtml } from "@/sanity/lib/render";

export type SiteSettingsContent = {
  updates: UpdateItem[];
  usefulLinks: UsefulLink[];
  popularGuides: Guide[];
};

export async function getGuides(): Promise<Guide[]> {
  const guides = await sanityReadClient.fetch<SanityGuide[]>(allGuidesQuery, {}, { next: { revalidate: sanityRevalidate } });
  return guides.map(toGuide);
}

export async function getGuideMap() {
  const guides = await getGuides();
  return new Map(guides.map((guide) => [guide.slug, guide]));
}

export async function getGuideBySlug(slug: string): Promise<Guide | null> {
  const guide = await sanityReadClient.fetch<SanityGuide | null>(guideBySlugQuery, { slug }, { next: { revalidate: sanityRevalidate } });
  return guide ? toGuide(guide) : null;
}

export async function getGlossary(): Promise<GlossaryEntry[]> {
  const entries = await sanityReadClient.fetch<SanityGlossaryEntry[]>(glossaryQuery, {}, { next: { revalidate: sanityRevalidate } });
  return entries.map((entry) => {
    const html = renderBlocks(entry.definition ?? []);
    const text = blocksToText(entry.definition ?? []);
    return {
      id: entry.legacyId || entry._id,
      term: entry.term,
      category: entry.category,
      aliases: entry.aliases ?? [],
      html,
      text,
      searchText: [entry.term, entry.category, ...(entry.aliases ?? []), text].join(" "),
    };
  });
}

export async function getSiteSettings(): Promise<SiteSettingsContent> {
  const settings = await sanityReadClient.fetch<SanitySiteSettings | null>(siteSettingsQuery, {}, { next: { revalidate: sanityRevalidate } });
  return {
    updates: settings?.updates ?? [],
    usefulLinks: settings?.usefulLinks ?? [],
    popularGuides: (settings?.popularGuides ?? []).map(toGuide),
  };
}

export async function searchSanityData(query: string) {
  const [guides, glossary] = await Promise.all([getGuides(), getGlossary()]);
  const q = query.trim();
  if (!q) return [];

  const guideResults = guides
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

  const glossaryResults = glossary
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

export { categoryMeta, homeSections };

type SanityGuide = {
  _id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  status: string;
  searchKeywords?: string[];
  body?: Record<string, unknown>[];
  sections?: Array<Record<string, unknown> & { title?: string; blocks?: Record<string, unknown>[] }>;
};

type SanityGlossaryEntry = {
  _id: string;
  term: string;
  legacyId?: string;
  category: string;
  aliases?: string[];
  definition?: Record<string, unknown>[];
};

type SanitySiteSettings = {
  updates?: UpdateItem[];
  usefulLinks?: UsefulLink[];
  popularGuides?: SanityGuide[];
};

function toGuide(guide: SanityGuide): Guide {
  const html = renderGuideHtml(guide);
  const bodyText = [blocksToText(guide.body ?? []), ...(guide.sections ?? []).map((section) => `${section.title ?? ""} ${blocksToText(section.blocks ?? [])}`)].join(" ");
  return {
    slug: guide.slug,
    title: guide.title,
    category: guide.category,
    status: guide.status,
    description: guide.description,
    aliases: guide.searchKeywords ?? [],
    html,
    text: bodyText,
    searchText: [guide.title, guide.description, ...(guide.searchKeywords ?? []), bodyText].join(" "),
  };
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
