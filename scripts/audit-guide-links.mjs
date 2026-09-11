import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createClient } from "@sanity/client";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputPath = path.join(rootDir, "guide-link-audit.report.json");

loadEnv();

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";
if (!projectId) throw new Error("Missing NEXT_PUBLIC_SANITY_PROJECT_ID.");

const client = createClient({ projectId, dataset, apiVersion: "2025-01-01", useCdn: false });
const guides = await client.fetch(`*[_type == "guide"]|order(order asc){
  _id,
  title,
  "slug": slug.current,
  body,
  sections[]{title, anchor, blocks}
}`);

const guideMap = new Map(guides.map((guide) => [guide.slug, guide]));
const anchorMap = new Map(guides.map((guide) => [guide.slug, collectAnchors(guide)]));
const links = guides.flatMap(collectGuideLinks);
const classified = links.map(classifyLink);

const report = {
  generatedAt: new Date().toISOString(),
  dataset,
  guides: guides.length,
  totals: summarize(classified),
  internalGuideLinks: summarize(classified.filter((item) => item.kind.startsWith("guide:"))),
  issues: {
    missingSlug: classified.filter((item) => item.problem === "missing-slug"),
    missingAnchor: classified.filter((item) => item.problem === "missing-anchor"),
    sectionDeepLinkCandidates: classified.filter((item) => item.problem === "section-deep-link-candidate"),
    ambiguousRootLinks: classified.filter((item) => item.problem === "ambiguous-root-link"),
  },
  links: classified,
};

fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(
  JSON.stringify(
    {
      report: path.basename(outputPath),
      guides: report.guides,
      totalLinks: report.totals.total,
      internalGuideLinks: report.internalGuideLinks.total,
      missingSlug: report.issues.missingSlug.length,
      missingAnchor: report.issues.missingAnchor.length,
      sectionDeepLinkCandidates: report.issues.sectionDeepLinkCandidates.length,
      ambiguousRootLinks: report.issues.ambiguousRootLinks.length,
    },
    null,
    2,
  ),
);

function collectGuideLinks(guide) {
  const links = [];
  for (const block of allGuideBlocks(guide)) {
    if (block?._type === "block") {
      for (const mark of block.markDefs ?? []) {
        if (mark?._type !== "link" || !mark.href) continue;
        links.push({
          sourceSlug: guide.slug,
          sourceTitle: guide.title,
          sourceBlockKey: block._key,
          sourceText: textForMark(block, mark._key),
          href: mark.href,
          sourceType: "markDef",
        });
      }
    }
    if (block?._type === "linkCard" && block.href) {
      links.push({
        sourceSlug: guide.slug,
        sourceTitle: guide.title,
        sourceBlockKey: block._key,
        sourceText: block.label ?? "",
        href: block.href,
        sourceType: "linkCard",
      });
    }
  }
  return links;
}

function classifyLink(link) {
  const href = String(link.href ?? "").trim();
  const base = { ...link, href };
  if (!href) return { ...base, kind: "empty", problem: "empty-href" };
  if (/^https?:\/\//i.test(href)) return { ...base, kind: "external", problem: null };
  if (href.startsWith("#")) return classifyGuideHash(base, link.sourceSlug, href.slice(1), "guide:same-page-hash");

  let url;
  try {
    url = new URL(href, "https://mff.local");
  } catch {
    return { ...base, kind: "other-internal", problem: "unparseable-internal" };
  }

  if (url.origin !== "https://mff.local") return { ...base, kind: "external", problem: null };
  const guideMatch = url.pathname.match(/^\/guides\/([^/]+)$/);
  if (!guideMatch) {
    return { ...base, kind: url.pathname === "/guides" ? "guide:index" : "other-internal", problem: null };
  }

  const slug = guideMatch[1];
  const sectionParam = url.searchParams.get("section");
  const hash = url.hash ? url.hash.slice(1) : "";
  if (!guideMap.has(slug)) return { ...base, kind: "guide:slug", targetSlug: slug, problem: "missing-slug" };
  if (hash) return classifyGuideHash(base, slug, hash, "guide:slug-hash");
  if (sectionParam) return classifyGuideHash(base, slug, sectionParam, "guide:slug-section-query");

  const candidates = sectionCandidates(slug, link.sourceText);
  if (candidates.length === 1) {
    return {
      ...base,
      kind: "guide:slug-root",
      targetSlug: slug,
      problem: "section-deep-link-candidate",
      suggestedHref: `/guides/${slug}#${candidates[0].anchor}`,
      suggestedTitle: candidates[0].title,
    };
  }
  if (candidates.length > 1 || /공략|보기|참고|필독|설정|여기/.test(link.sourceText ?? "")) {
    return { ...base, kind: "guide:slug-root", targetSlug: slug, problem: "ambiguous-root-link", candidates };
  }
  return { ...base, kind: "guide:slug-root", targetSlug: slug, problem: null };
}

function classifyGuideHash(link, slug, rawAnchor, kind) {
  const anchor = safeDecodeURIComponent(rawAnchor);
  const targetAnchors = anchorMap.get(slug);
  if (!targetAnchors) return { ...link, kind, targetSlug: slug, targetAnchor: anchor, problem: "missing-slug" };
  if (!targetAnchors.has(anchor)) return { ...link, kind, targetSlug: slug, targetAnchor: anchor, problem: "missing-anchor" };
  return {
    ...link,
    kind,
    targetSlug: slug,
    targetAnchor: anchor,
    targetTitle: targetAnchors.get(anchor)?.title ?? "",
    problem: null,
  };
}

function collectAnchors(guide) {
  const anchors = new Map();
  for (const section of guide.sections ?? []) {
    const anchor = section?.anchor?.current;
    if (anchor) anchors.set(anchor, { type: "section", title: section.title ?? "" });
  }
  for (const block of allGuideBlocks(guide)) {
    if (block?._type === "block" && ["h2", "h3", "h4"].includes(block.style) && block._key) {
      anchors.set(block._key, { type: "block", title: blockText(block) });
      const textAnchor = slugId(blockText(block));
      if (textAnchor) anchors.set(textAnchor, { type: "block-text", title: blockText(block) });
    }
  }
  return anchors;
}

function sectionCandidates(slug, sourceText) {
  const needle = normalizeText(sourceText);
  if (!needle) return [];
  return (guideMap.get(slug)?.sections ?? [])
    .map((section) => ({ title: section.title ?? "", anchor: section.anchor?.current ?? "" }))
    .filter((section) => section.anchor && normalizeText(section.title).includes(needle));
}

function allGuideBlocks(guide) {
  return [...(guide.body ?? []), ...(guide.sections ?? []).flatMap((section) => section.blocks ?? [])].flatMap(expandNestedBlocks);
}

function expandNestedBlocks(block) {
  if (!block) return [];
  if (block._type === "callout" || block._type === "detailsBlock") return [block, ...(block.content ?? []).flatMap(expandNestedBlocks)];
  if (block._type === "repeatedItemGrid") return [block, ...(block.items ?? []).flatMap((item) => [item.image, ...(item.content ?? [])].flatMap(expandNestedBlocks))];
  return [block];
}

function textForMark(block, markKey) {
  return (block.children ?? [])
    .filter((child) => child?._type === "span" && (child.marks ?? []).includes(markKey))
    .map((child) => child.text ?? "")
    .join("")
    .trim();
}

function blockText(block) {
  return (block.children ?? [])
    .filter((child) => child?._type === "span")
    .map((child) => child.text ?? "")
    .join("")
    .trim();
}

function summarize(items) {
  const byKind = {};
  const byProblem = {};
  for (const item of items) {
    byKind[item.kind] = (byKind[item.kind] ?? 0) + 1;
    byProblem[item.problem ?? "ok"] = (byProblem[item.problem ?? "ok"] ?? 0) + 1;
  }
  return { total: items.length, byKind, byProblem };
}

function normalizeText(value) {
  return String(value ?? "")
    .replace(/[()[\]{}'"“”‘’<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function slugId(value) {
  return String(value ?? "")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function safeDecodeURIComponent(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function loadEnv() {
  const envPath = path.join(rootDir, ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([^#=]+?)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
  }
}
