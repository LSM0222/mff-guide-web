import type { GlossaryEntry, Guide, GuideBodySearchTarget, UpdateItem, UsefulLink } from "@/content/types";
import { guideCategoryMeta } from "@/content/guide-taxonomy";
import { normalizeSearch, type SearchScope } from "@/content/search-utils";
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
    updates: (settings?.updates ?? []).map((update) => ({ ...update, route: normalizeGuideSectionRoute(update.route) })),
    usefulLinks: settings?.usefulLinks ?? [],
    popularGuides: (settings?.popularGuides ?? []).map(toGuide),
  };
}

export type SearchResult = Awaited<ReturnType<typeof searchSanityData>>[number];

export async function searchSanityData(query: string, scope: SearchScope = "title") {
  const [guides, glossary] = await Promise.all([getGuides(), getGlossary()]);
  const q = normalizeSearch(query);
  if (!q) return [];

  const guideResults = guides
    .map((guide) => {
      const titleScore = scoreTitle(guide.title, q, guide.aliases ?? []);
      const bodyMatch = scope !== "title" ? findBodyMatch(guide, q) : null;
      const bodyScore = bodyMatch ? scoreBody(bodyMatch.text, q) : 0;
      const score = scope === "title" ? titleScore : scope === "body" ? bodyScore : Math.max(titleScore, bodyScore);
      if (!score) return null;
      const titleMatch = scope !== "body" && titleScore > 0 && (scope === "title" || titleScore >= bodyScore);
      const match = titleMatch ? ("title" as const) : ("body" as const);
      return {
        type: "공략" as const,
        title: guide.title,
        desc: match === "body" && bodyMatch?.snippet ? bodyMatch.snippet : guide.description,
        route: match === "body" && bodyMatch ? bodyMatchRoute(guide.slug, query, bodyMatch.anchor) : `/guides/${guide.slug}`,
        match,
        coming: guide.status === "coming",
        score,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  const glossaryResults =
    scope === "all"
      ? glossary
          .map((entry) => {
            const searchText = entry.searchText ?? `${entry.term} ${entry.category} ${entry.text}`;
            const score = scoreText(searchText, q, entry.term);
            if (!score) return null;
            return {
              type: "용어" as const,
              title: entry.term,
              desc: entry.category,
              route: `/glossary?term=${encodeURIComponent(entry.id)}&q=${encodeURIComponent(query.trim())}`,
              match: "glossary" as const,
              score,
            };
          })
          .filter((item): item is NonNullable<typeof item> => Boolean(item))
      : [];

  return [...guideResults, ...glossaryResults].sort((a, b) => b.score - a.score).slice(0, 40);
}

export const categoryMeta = guideCategoryMeta;

type SanityGuide = {
  _id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  status: string;
  searchKeywords?: string[];
  body?: Record<string, unknown>[];
  sections?: Array<Record<string, unknown> & { title?: string; blocks?: Record<string, unknown>[]; anchor?: { current?: string } }>;
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
  const bodySearchTargets = guideBodySearchTargets(guide);
  const bodyText = bodySearchTargets.map((target) => target.text).join(" ");
  return {
    slug: guide.slug,
    title: guide.title,
    category: guide.category,
    status: guide.status,
    description: guide.description,
    aliases: guide.searchKeywords ?? [],
    html,
    text: bodyText,
    bodySearchTargets,
    searchText: [guide.title, guide.description, ...(guide.searchKeywords ?? []), bodyText].join(" "),
  };
}

function guideBodySearchTargets(guide: SanityGuide): GuideBodySearchTarget[] {
  const targets: GuideBodySearchTarget[] = [];
  const introText = blocksToText(guide.body ?? []);
  if (introText) targets.push({ text: introText });
  for (const section of guide.sections ?? []) {
    const text = [section.title, blocksToText(section.blocks ?? [])].filter(Boolean).join(" ");
    if (text) targets.push({ text, anchor: currentSlug(section.anchor) || undefined });
  }
  return targets;
}

function normalizeGuideSectionRoute(route: string) {
  const match = route.match(/^(\/guides\/[^?#]+)\?section=([^&#]+)$/);
  if (!match) return route;
  return `${match[1]}#${safeDecodeURIComponent(match[2])}`;
}

function safeDecodeURIComponent(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function currentSlug(value: unknown): string {
  if (!value || typeof value !== "object") return "";
  const current = (value as { current?: unknown }).current;
  return typeof current === "string" ? current : "";
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

function scoreTitle(title: string, query: string, aliases: string[]) {
  const q = normalizeSearch(query);
  const normalizedTitle = normalizeSearch(title);
  if (!q) return 0;
  if (normalizedTitle === q) return 300;
  if (normalizedTitle.startsWith(q)) return 240;
  if (normalizedTitle.includes(q)) return 220;
  if (aliases.some((alias) => normalizeSearch(alias) === q)) return 210;
  if (aliases.some((alias) => normalizeSearch(alias).includes(q))) return 180;
  const parts = q.split(" ").filter(Boolean);
  if (parts.length > 1 && parts.every((part) => normalizedTitle.includes(part))) return 160;
  return 0;
}

function scoreBody(text: string, query: string) {
  const haystack = normalizeSearch(text);
  if (haystack.includes(query)) return 100;
  const parts = query.split(" ").filter(Boolean);
  if (parts.length > 1 && parts.every((part) => haystack.includes(part))) return 70;
  return 0;
}

function findBodyMatch(guide: Guide, query: string) {
  for (const target of guide.bodySearchTargets ?? [{ text: guide.text }]) {
    const text = target.text;
    const normalizedText = normalizeSearch(text);
    const index = normalizedText.indexOf(query);
    const parts = query.split(" ").filter(Boolean);
    const fallbackPart = parts.length > 1 ? parts.find((part) => normalizedText.includes(part)) : undefined;
    const fallbackIndex = fallbackPart ? normalizedText.indexOf(fallbackPart) : -1;
    const matchIndex = index >= 0 ? index : fallbackIndex;
    if (matchIndex < 0) continue;
    return {
      text,
      anchor: target.anchor,
      snippet: excerpt(text, matchIndex, index >= 0 ? query.length : fallbackPart?.length ?? query.length),
    };
  }
  return null;
}

function excerpt(text: string, index: number, length: number) {
  const normalized = text.replace(/\s+/g, " ").trim();
  const start = Math.max(0, index - 42);
  const end = Math.min(normalized.length, index + length + 58);
  return `${start > 0 ? "..." : ""}${normalized.slice(start, end)}${end < normalized.length ? "..." : ""}`;
}

function bodyMatchRoute(slug: string, query: string, anchor?: string) {
  const search = `?q=${encodeURIComponent(query.trim())}`;
  return `/guides/${slug}${search}${anchor ? `#${encodeURIComponent(anchor)}` : ""}`;
}
