import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, "..");
const sourcePath = path.resolve(root, "..", "mff_guide_full_prototype_v14_lightbox.html");
const contentRoot = path.join(root, "content");
const guidesRoot = path.join(contentRoot, "guides");

function readSource() {
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Missing v14 prototype: ${sourcePath}`);
  }
  return fs.readFileSync(sourcePath, "utf8");
}

function extractBalanced(source, marker) {
  const markerIndex = source.indexOf(marker);
  if (markerIndex === -1) throw new Error(`Could not find marker: ${marker}`);

  let index = markerIndex + marker.length;
  while (/\s/.test(source[index])) index += 1;

  const start = index;
  let depth = 0;
  let quote = null;
  let escaped = false;

  for (; index < source.length; index += 1) {
    const char = source[index];

    if (quote) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === quote) quote = null;
      continue;
    }

    if (char === '"' || char === "'" || char === "`") {
      quote = char;
      continue;
    }

    if (char === "{") depth += 1;
    else if (char === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(start, index + 1);
    }
  }

  throw new Error(`Unterminated object after marker: ${marker}`);
}

function extractStyle(source) {
  const match = source.match(/<style>([\s\S]*?)<\/style>/i);
  if (!match) throw new Error("Could not find prototype style tag");
  return match[1].trim();
}

function slugToIdentifier(slug) {
  return slug
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part, index) => {
      const normalized = part.charAt(0).toUpperCase() + part.slice(1);
      return index === 0 ? part : normalized;
    })
    .join("")
    .replace(/^[0-9]/, "_$&");
}

function rewriteHashHref(value) {
  if (value === "#/") return "/";
  if (value === "#/guides") return "/guides";
  if (value === "#/glossary") return "/glossary";
  if (value === "#top") return "#top";

  const guideMatch = value.match(/^#\/guide\/([^?]+)(\?.*)?$/);
  if (guideMatch) return `/guides/${guideMatch[1]}${guideMatch[2] || ""}`;

  const categoryMatch = value.match(/^#\/category\/([^?]+)(\?.*)?$/);
  if (categoryMatch) return `/guides?category=${encodeURIComponent(categoryMatch[1])}`;

  const searchMatch = value.match(/^#\/search(\?.*)?$/);
  if (searchMatch) return `/search${searchMatch[1] || ""}`;

  return value;
}

function rewriteAttributeValues(html) {
  return html.replace(/\b(src|href)=(")(.*?)\2/g, (_match, attr, quote, value) => {
    let nextValue = value;

    if (attr === "src" && value.startsWith("_site_media/")) {
      nextValue = `/media/${value.slice("_site_media/".length)}`;
    }

    if (attr === "href" && value.startsWith("#/")) {
      nextValue = rewriteHashHref(value);
    }

    return `${attr}=${quote}${nextValue}${quote}`;
  });
}

function plainText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function countMatches(text, pattern) {
  return (text.match(pattern) || []).length;
}

function normalizeData(data) {
  return {
    ...data,
    guides: data.guides.map((guide) => {
      const html = rewriteAttributeValues(guide.html || "");
      return { ...guide, html, text: plainText(html) };
    }),
    glossary: data.glossary.map((entry) => {
      const html = rewriteAttributeValues(entry.html || "");
      return { ...entry, html, text: plainText(html) };
    }),
  };
}

function writeTs(filePath, source) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, source, "utf8");
}

function moduleSource(exportName, value, typeName) {
  const importName = typeName.replace(/\[\]$/, "");
  return `import type { ${importName} } from "@/content/types";\n\nexport const ${exportName}: ${typeName} = ${JSON.stringify(value, null, 2)};\n`;
}

function buildGuideIndex(guides) {
  const imports = guides
    .map((guide) => {
      const id = `${slugToIdentifier(guide.slug)}Guide`;
      return `import { ${id} } from "./guides/${guide.slug}";`;
    })
    .join("\n");
  const items = guides.map((guide) => `${slugToIdentifier(guide.slug)}Guide`).join(",\n  ");

  return `${imports}\n\nimport { glossary } from "./glossary";\nimport { categoryMeta, homeSections, links, popular, updates } from "./site";\n\nexport const guides = [\n  ${items},\n];\n\nexport const guideMap = new Map(guides.map((guide) => [guide.slug, guide]));\n\nexport { categoryMeta, glossary, homeSections, links, popular, updates };\n`;
}

function auditData(data) {
  const guideHtml = data.guides.map((guide) => guide.html || "").join("\n");
  const glossaryHtml = data.glossary.map((entry) => entry.html || "").join("\n");
  const allHtml = `${guideHtml}\n${glossaryHtml}`;

  return {
    guides: data.guides.length,
    slugs: data.guides.map((guide) => guide.slug),
    titles: data.guides.map((guide) => guide.title),
    headings: countMatches(guideHtml, /<h[1-6]\b/g),
    images: countMatches(guideHtml, /<img\b/g),
    videos: countMatches(guideHtml, /<video\b/g),
    sources: countMatches(guideHtml, /<source\b/g),
    externalImages: countMatches(guideHtml, /<img\b[^>]*src="https?:\/\//g),
    links: countMatches(allHtml, /<a\b/g),
    glossaryEntries: data.glossary.length,
  };
}

function main() {
  const source = readSource();
  const rawData = JSON.parse(extractBalanced(source, "const DATA="));
  const data = normalizeData(rawData);
  const style = extractStyle(source);

  fs.rmSync(guidesRoot, { recursive: true, force: true });
  fs.mkdirSync(guidesRoot, { recursive: true });

  for (const guide of data.guides) {
    writeTs(
      path.join(guidesRoot, `${guide.slug}.ts`),
      moduleSource(`${slugToIdentifier(guide.slug)}Guide`, guide, "Guide"),
    );
  }

  writeTs(path.join(contentRoot, "glossary.ts"), moduleSource("glossary", data.glossary, "GlossaryEntry[]"));
  writeTs(
    path.join(contentRoot, "site.ts"),
    `import type { CategoryMeta, HomeSection, UsefulLink, UpdateItem } from "@/content/types";\n\nexport const categoryMeta: CategoryMeta = ${JSON.stringify(data.categoryMeta, null, 2)};\n\nexport const homeSections: HomeSection[] = ${JSON.stringify(data.homeSections.map((section) => ({ ...section, cards: section.cards.map((card) => ({ ...card, route: rewriteHashHref(card.route) })) })), null, 2)};\n\nexport const updates: UpdateItem[] = ${JSON.stringify(data.updates.map((item) => ({ ...item, route: rewriteHashHref(item.route) })), null, 2)};\n\nexport const popular: string[] = ${JSON.stringify(data.popular, null, 2)};\n\nexport const links: UsefulLink[] = ${JSON.stringify(data.links, null, 2)};\n`,
  );
  writeTs(path.join(contentRoot, "index.ts"), buildGuideIndex(data.guides));
  writeTs(path.join(root, "app", "v14-prototype.css"), `${style}\n`);
  writeTs(path.join(root, "content-audit.v14.json"), `${JSON.stringify(auditData(data), null, 2)}\n`);

  console.log(JSON.stringify(auditData(data), null, 2));
}

main();
