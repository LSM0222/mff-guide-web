import crypto from "node:crypto";
import fs from "node:fs";
import Module from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createClient } from "@sanity/client";
import { getCliClient } from "sanity/cli";
import * as parse5 from "parse5";
import ts from "typescript";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, "..");
const reportPath = path.join(rootDir, "migration-dry-run.report.json");
const auditReportPath = path.join(rootDir, "sanity-migration-audit.report.json");
const apiVersion = "2025-01-01";

const args = new Set(process.argv.slice(2));
const shouldWrite = args.has("--write");
const shouldVerify = args.has("--verify") || shouldWrite;

loadEnv();
installTypeScriptLoader();

const requireFromRoot = Module.createRequire(path.join(rootDir, "package.json"));
const content = requireFromRoot("./content/index.ts");

const localMediaFiles = new Set(
  fs
    .readdirSync(path.join(rootDir, "public", "media"), { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => `/media/${entry.name}`),
);

const migration = buildMigration();
const dryRunReport = buildReport(migration, null);
fs.writeFileSync(reportPath, `${JSON.stringify(dryRunReport, null, 2)}\n`);

console.log(
  JSON.stringify(
    {
      mode: shouldWrite ? "write" : "dry-run",
      report: path.basename(reportPath),
      guides: migration.guides.length,
      glossary: migration.glossary.length,
      siteSettings: Boolean(migration.siteSettings),
      localMediaMissing: dryRunReport.media.localMissing.length,
      externalImages: dryRunReport.media.externalImageCount,
      videos: dryRunReport.media.videoCount,
      parityOk: dryRunReport.parity.ok,
    },
    null,
    2,
  ),
);

if (!dryRunReport.parity.ok || dryRunReport.media.localMissing.length) {
  console.error("Dry-run audit failed. Production mutation was not attempted.");
  process.exit(1);
}

const client = sanityClient(shouldWrite);
const existing = await client.fetch(
  '{"guideIds": *[_type=="guide"]._id, "glossaryIds": *[_type=="glossaryEntry"]._id, "settingsIds": *[_type=="siteSettings"]._id, "count": count(*)}',
);

if (!shouldWrite) {
  console.log(JSON.stringify({ productionDatasetExistingDocuments: existing }, null, 2));
  process.exit(0);
}

const expectedIds = new Set([
  ...migration.guides.map((guide) => guide._id),
  ...migration.glossary.map((entry) => entry._id),
  migration.siteSettings._id,
]);
const unexpectedIds = [...existing.guideIds, ...existing.glossaryIds, ...existing.settingsIds].filter((id) => !expectedIds.has(id));
if (unexpectedIds.length) {
  console.error(JSON.stringify({ error: "Unexpected existing Sanity documents found. Refusing to overwrite.", unexpectedIds }, null, 2));
  process.exit(1);
}

await writeDocuments(client, migration);

if (shouldVerify) {
  const remote = await fetchMigratedDocuments(client);
  const auditReport = buildReport(migration, remote);
  fs.writeFileSync(auditReportPath, `${JSON.stringify(auditReport, null, 2)}\n`);
  console.log(
    JSON.stringify(
      {
        verifyReport: path.basename(auditReportPath),
        guides: remote.guides.length,
        glossary: remote.glossary.length,
        siteSettings: Boolean(remote.siteSettings),
        parityOk: auditReport.parity.ok,
      },
      null,
      2,
    ),
  );
  if (!auditReport.parity.ok) process.exit(1);
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

function installTypeScriptLoader() {
  const originalResolve = Module._resolveFilename;
  Module._resolveFilename = function resolveAlias(request, parent, isMain, options) {
    if (request.startsWith("@/")) {
      return originalResolve.call(this, path.join(rootDir, request.slice(2)), parent, isMain, options);
    }
    return originalResolve.call(this, request, parent, isMain, options);
  };

  Module._extensions[".ts"] = function compileTs(module, filename) {
    const source = fs.readFileSync(filename, "utf8");
    const output = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
        esModuleInterop: true,
        jsx: ts.JsxEmit.ReactJSX,
      },
      fileName: filename,
    }).outputText;
    module._compile(output, filename);
  };
}

function buildMigration() {
  const guides = content.guides.map((guide, order) => {
    const parsed = convertGuideHtml(guide);
    return {
      _id: `guide-${guide.slug}`,
      _type: "guide",
      title: guide.title,
      slug: { _type: "slug", current: guide.slug },
      description: guide.description,
      category: guide.category,
      status: guide.status,
      order,
      searchKeywords: guide.aliases ?? [],
      sections: parsed.sections,
      body: parsed.body,
      sourceTextHash: hash(normalizeText(guide.text)),
      sourceHtmlHash: hash(guide.html),
    };
  });

  const glossary = content.glossary.map((entry, order) => ({
    _id: `glossary-${key(entry.id)}`,
    _type: "glossaryEntry",
    term: entry.term,
    legacyId: entry.id,
    category: entry.category,
    aliases: entry.aliases ?? [],
    definition: convertBlocks(parse5.parseFragment(entry.html).childNodes, `glossary-${entry.id}`),
    order,
    sourceTextHash: hash(normalizeText(entry.text)),
    sourceHtmlHash: hash(entry.html),
  }));

  const siteSettings = {
    _id: "siteSettings",
    _type: "siteSettings",
    updates: withKeys(content.updates, "update"),
    usefulLinks: withKeys(content.links, "link"),
    popularGuides: content.popular.map((slug, index) => ({
      _key: key(`popular-${slug}-${index}`),
      _type: "reference",
      _ref: `guide-${slug}`,
    })),
  };

  return { guides, glossary, siteSettings };
}

function convertGuideHtml(guide) {
  const nodes = parse5.parseFragment(guide.html).childNodes;
  const bodyNodes = [];
  const sections = [];

  for (const node of nodes) {
    if (isElement(node, "section") && classList(node).includes("article-subsection")) {
      sections.push(convertSection(node, guide.slug, sections.length));
    } else if (!isBlankText(node)) {
      bodyNodes.push(node);
    }
  }

  return {
    body: bodyNodes.length ? convertBlocks(bodyNodes, `${guide.slug}-body`, guide.slug) : undefined,
    sections,
  };
}

function convertSection(section, guideSlug, order) {
  const children = elementChildren(section);
  const heading = children.find((node) => isHeading(node));
  const title = heading ? textContent(heading).trim() : `Section ${order + 1}`;
  const anchor = getAttr(section, "id") || getAttr(heading, "id") || slugId(title);
  const blocks = convertBlocks(
    children.filter((node) => node !== heading),
    `${guideSlug}-${anchor}`,
    guideSlug,
  );
  const sectionDepth = classList(section)
    .map((item) => item.match(/^depth-(\d)$/)?.[1])
    .find(Boolean);
  const level = heading?.tagName ? Number(heading.tagName.replace("h", "")) : Number(sectionDepth ?? 2) + 1;

  return {
    _key: key(`${guideSlug}-${anchor}-${order}`),
    _type: "guideSection",
    title,
    anchor: { _type: "slug", current: anchor },
    status: "published",
    level: Math.max(2, Math.min(4, level || 2)),
    order,
    blocks,
  };
}

function convertBlocks(nodes, seed, guideSlug = "") {
  const blocks = [];
  nodes.forEach((node, index) => {
    if (isBlankText(node)) return;
    const block = convertBlock(node, `${seed}-${index}`, guideSlug);
    if (Array.isArray(block)) blocks.push(...block);
    else if (block) blocks.push(block);
  });
  return blocks;
}

function convertBlock(node, seed, guideSlug) {
  if (isText(node)) return portableBlock("normal", inlineChildren([node], seed), seed);
  if (!isElementNode(node)) return null;

  const tag = node.tagName;
  if (tag === "p" || isHeading(node)) {
    return portableBlock(headingStyle(tag), inlineChildren(node.childNodes ?? [], seed), seed, listItemType(node));
  }
  if (tag === "ul" || tag === "ol") {
    return elementChildren(node)
      .filter((child) => isElement(child, "li"))
      .map((li, index) => portableBlock("normal", inlineChildren(li.childNodes ?? [], `${seed}-li-${index}`), `${seed}-li-${index}`, tag === "ol" ? "number" : "bullet"));
  }
  if (tag === "figure") return convertFigure(node, seed, guideSlug);
  if (tag === "video") return convertVideo(node, seed, guideSlug);
  if (tag === "table") return convertTable(node, seed);
  if (tag === "details") return convertDetails(node, seed, guideSlug);
  if (tag === "hr") return { _key: key(seed), _type: "dividerBlock" };

  const classes = classList(node);
  if (classes.includes("callout")) return convertCallout(node, seed, guideSlug);
  if (classes.includes("table-wrap")) {
    const table = elementChildren(node).find((child) => isElement(child, "table"));
    return table ? convertTable(table, seed) : convertBlocks(elementChildren(node), seed, guideSlug);
  }
  if (classes.includes("content-columns")) return convertRepeatedGrid(node, seed, guideSlug);
  if (classes.includes("link-card")) return convertLinkCard(node, seed);

  return convertBlocks(elementChildren(node), seed, guideSlug);
}

function inlineChildren(nodes, seed, activeMarks = [], markDefs = []) {
  const spans = [];
  nodes.forEach((node, index) => {
    appendInline(node, `${seed}-span-${index}`, activeMarks, markDefs, spans);
  });
  if (!spans.length) spans.push(span("", seed, activeMarks));
  return { children: mergeSpans(spans), markDefs };
}

function appendInline(node, seed, activeMarks, markDefs, spans) {
  if (isText(node)) {
    spans.push(span(node.value, seed, activeMarks));
    return;
  }
  if (!isElementNode(node)) return;
  if (node.tagName === "br") {
    spans.push(span("\n", seed, activeMarks));
    return;
  }

  const nextMarks = [...activeMarks];
  if (node.tagName === "strong" || node.tagName === "b") nextMarks.push("strong");
  if (node.tagName === "em" || node.tagName === "i") nextMarks.push("em");
  if (node.tagName === "mark") nextMarks.push("highlight");
  if (node.tagName === "del" || node.tagName === "s") nextMarks.push("strike-through");
  if (node.tagName === "a") {
    const href = getAttr(node, "href");
    if (href) {
      const linkKey = key(`${seed}-${href}`);
      markDefs.push({ _key: linkKey, _type: "link", href });
      nextMarks.push(linkKey);
    }
  }

  for (const child of node.childNodes ?? []) appendInline(child, `${seed}-${child.nodeName}`, nextMarks, markDefs, spans);
}

function portableBlock(style, inline, seed, listItem) {
  const block = {
    _key: key(seed),
    _type: "block",
    style,
    markDefs: inline.markDefs,
    children: inline.children,
  };
  if (listItem) {
    block.listItem = listItem;
    block.level = 1;
  }
  return block;
}

function span(text, seed, marks) {
  return { _key: key(`${seed}-${text.length}`), _type: "span", text, marks: [...new Set(marks)] };
}

function mergeSpans(spans) {
  const merged = [];
  for (const item of spans) {
    const prev = merged[merged.length - 1];
    if (prev && JSON.stringify(prev.marks) === JSON.stringify(item.marks)) {
      prev.text += item.text;
    } else {
      merged.push({ ...item, _key: key(`${item._key}-${merged.length}`) });
    }
  }
  return merged;
}

function convertFigure(node, seed, guideSlug) {
  const img = findElement(node, "img");
  const video = findElement(node, "video");
  if (img) return convertImage(img, textContent(findElement(node, "figcaption")).trim(), seed, guideSlug);
  if (video) return convertVideo(video, seed, guideSlug, textContent(findElement(node, "figcaption")).trim());
  return null;
}

function convertImage(img, caption, seed, guideSlug) {
  const src = getAttr(img, "src") ?? "";
  const block = {
    _key: key(seed),
    _type: "contentImage",
    alt: getAttr(img, "alt") || caption || src.split("/").pop() || "Image",
    caption: caption || undefined,
    layoutVariant: imageVariant(guideSlug),
  };
  if (/^https?:\/\//.test(src)) block.externalSrc = src;
  else block.legacySrc = src;
  return block;
}

function convertVideo(video, seed, guideSlug, caption = "") {
  const src = getAttr(video, "src") || getAttr(findElement(video, "source"), "src") || "";
  const block = {
    _key: key(seed),
    _type: "contentVideo",
    caption: caption || undefined,
    layoutVariant: imageVariant(guideSlug),
  };
  if (/^https?:\/\//.test(src)) block.externalSrc = src;
  else block.legacySrc = src;
  return block;
}

function convertCallout(node, seed, guideSlug) {
  const variant = classList(node).find((item) => ["info", "warn", "danger", "neutral"].includes(item)) ?? "info";
  const body = elementChildren(node).find((child) => classList(child).includes("callout-body")) ?? node;
  return {
    _key: key(seed),
    _type: "callout",
    variant,
    content: convertBlocks(elementChildren(body), `${seed}-callout`, guideSlug),
  };
}

function convertTable(table, seed) {
  const rows = findAll(table, "tr").map((tr, rowIndex) => {
    const cells = elementChildren(tr)
      .filter((cell) => isElement(cell, "th") || isElement(cell, "td"))
      .map((cell) => textContent(cell).trim());
    return { _key: key(`${seed}-row-${rowIndex}`), _type: "tableRow", cells };
  });
  const firstRow = rows[0]?.cells ?? [];
  const hasHeaders = elementChildren(findAll(table, "tr")[0] ?? {}).some((cell) => isElement(cell, "th"));
  return {
    _key: key(seed),
    _type: "contentTable",
    title: `Table ${seed}`,
    headers: hasHeaders ? firstRow : undefined,
    rows: hasHeaders ? rows.slice(1) : rows,
  };
}

function convertDetails(node, seed, guideSlug) {
  const summary = elementChildren(node).find((child) => isElement(child, "summary"));
  return {
    _key: key(seed),
    _type: "detailsBlock",
    summary: textContent(summary).trim() || "Details",
    content: convertBlocks(
      elementChildren(node).filter((child) => child !== summary),
      `${seed}-details`,
      guideSlug,
    ),
  };
}

function convertRepeatedGrid(node, seed, guideSlug) {
  const columns = elementChildren(node).filter((child) => classList(child).includes("content-column"));
  return {
    _key: key(seed),
    _type: "repeatedItemGrid",
    title: undefined,
    variant: gridVariant(guideSlug),
    items: columns.map((column, index) => convertRepeatedItem(column, `${seed}-item-${index}`, guideSlug, index)),
  };
}

function convertRepeatedItem(column, seed, guideSlug, order) {
  const children = elementChildren(column);
  const firstFigure = children.find((child) => isElement(child, "figure") && findElement(child, "img"));
  const image = firstFigure ? convertFigure(firstFigure, `${seed}-image`, guideSlug) : undefined;
  const leadingText = textContent(children.find((child) => isElement(child, "p"))).trim();
  const title = image?.caption || image?.alt || leadingText || `Item ${order + 1}`;
  const contentNodes = firstFigure ? children.filter((child) => child !== firstFigure) : children;
  return {
    _key: key(seed),
    _type: "repeatedItem",
    title,
    image,
    content: convertBlocks(contentNodes, `${seed}-content`, guideSlug),
    order,
  };
}

function convertLinkCard(node, seed) {
  const link = findElement(node, "a");
  return {
    _key: key(seed),
    _type: "linkCard",
    label: textContent(link).trim() || getAttr(link, "href") || "Link",
    href: getAttr(link, "href") || "/",
  };
}

function buildReport(local, remote) {
  const source = {
    guides: content.guides.map((guide) => auditGuideSource(guide)),
    glossary: content.glossary.map((entry) => auditHtml(entry.html, entry.text)),
    site: {
      usefulLinks: content.links.length,
      updates: content.updates.length,
      popularGuides: content.popular.length,
    },
  };
  const migrated = {
    guides: local.guides.map((guide) => auditGuideDocument(guide)),
    glossary: local.glossary.map((entry) => auditGlossaryDocument(entry)),
    site: {
      usefulLinks: local.siteSettings.usefulLinks.length,
      updates: local.siteSettings.updates.length,
      popularGuides: local.siteSettings.popularGuides.length,
    },
  };
  const remoteAudit = remote
    ? {
        guides: remote.guides.map((guide) => auditGuideDocument(guide)),
        glossary: remote.glossary.map((entry) => auditGlossaryDocument(entry)),
        site: {
          usefulLinks: remote.siteSettings?.usefulLinks?.length ?? 0,
          updates: remote.siteSettings?.updates?.length ?? 0,
          popularGuides: remote.siteSettings?.popularGuides?.length ?? 0,
        },
      }
    : null;

  return {
    generatedAt: new Date().toISOString(),
    mode: remote ? "verify" : "dry-run",
    source,
    migrated,
    remote: remoteAudit,
    media: mediaAudit(source.guides),
    parity: parity(source, migrated, remoteAudit),
  };
}

function auditGuideSource(guide) {
  const htmlAudit = auditHtml(guide.html, guide.text);
  return {
    slug: guide.slug,
    title: guide.title,
    category: guide.category,
    status: guide.status,
    sections: htmlAudit.sectionCount,
    headings: htmlAudit.headingCount,
    paragraphs: htmlAudit.paragraphCount,
    images: htmlAudit.imageCount,
    videos: htmlAudit.videoCount,
    externalImages: htmlAudit.externalImageCount,
    links: htmlAudit.links,
    textHash: hash(normalizeText(guide.text)),
  };
}

function auditGuideDocument(guide) {
  const blocks = allGuideBlocks(guide);
  return {
    slug: guide.slug?.current,
    title: guide.title,
    category: guide.category,
    status: guide.status,
    sections: guide.sections?.length ?? 0,
    headings: blocks.filter((block) => block._type === "block" && ["h2", "h3", "h4"].includes(block.style)).length + (guide.sections?.length ?? 0),
    paragraphs: blocks.filter((block) => block._type === "block" && !block.listItem && block.style === "normal").length,
    images: countBlocks(blocks, "contentImage"),
    videos: countBlocks(blocks, "contentVideo"),
    externalImages: blocks.filter((block) => block._type === "contentImage" && block.externalSrc).length,
    links: collectBlockLinks(blocks),
    textHash: guide.sourceTextHash,
  };
}

function auditGlossaryDocument(entry) {
  const blocks = entry.definition ?? [];
  return {
    term: entry.term,
    category: entry.category,
    images: countBlocks(blocks, "contentImage"),
    videos: countBlocks(blocks, "contentVideo"),
    links: collectBlockLinks(blocks),
    textHash: entry.sourceTextHash,
  };
}

function auditHtml(html, text) {
  const fragment = parse5.parseFragment(html);
  const imgs = findAll(fragment, "img");
  const videos = findAll(fragment, "video");
  return {
    sectionCount: findAll(fragment, "section").filter((node) => classList(node).includes("article-subsection")).length,
    headingCount: findAll(fragment, "h2").length + findAll(fragment, "h3").length + findAll(fragment, "h4").length,
    paragraphCount: findAll(fragment, "p").length,
    imageCount: imgs.length,
    videoCount: videos.length,
    externalImageCount: imgs.filter((img) => /^https?:\/\//.test(getAttr(img, "src") ?? "")).length,
    localImages: imgs.map((img) => getAttr(img, "src")).filter((src) => src?.startsWith("/media/")),
    localVideos: videos.map((video) => getAttr(video, "src")).filter((src) => src?.startsWith("/media/")),
    links: findAll(fragment, "a").map((link) => getAttr(link, "href")).filter(Boolean).sort(),
    textHash: hash(normalizeText(textContent(fragment) || text || "")),
  };
}

function mediaAudit(guideAudits) {
  const localRefs = new Set();
  for (const guide of content.guides) collectMediaRefs(guide.html).forEach((src) => localRefs.add(src));
  for (const entry of content.glossary) collectMediaRefs(entry.html).forEach((src) => localRefs.add(src));
  const localMissing = [...localRefs].filter((src) => !localMediaFiles.has(src)).sort();
  return {
    localReferenceCount: localRefs.size,
    localMissing,
    imageCount: guideAudits.reduce((sum, guide) => sum + guide.images, 0),
    videoCount: guideAudits.reduce((sum, guide) => sum + guide.videos, 0),
    externalImageCount: guideAudits.reduce((sum, guide) => sum + guide.externalImages, 0),
  };
}

function collectMediaRefs(html) {
  const fragment = parse5.parseFragment(html);
  return [...findAll(fragment, "img"), ...findAll(fragment, "video"), ...findAll(fragment, "source")]
    .map((node) => getAttr(node, "src"))
    .filter((src) => src?.startsWith("/media/"));
}

function parity(source, migrated, remote) {
  const checks = [];
  checks.push(["guide count", source.guides.length, migrated.guides.length]);
  checks.push(["glossary count", source.glossary.length, migrated.glossary.length]);
  checks.push(["useful links count", source.site.usefulLinks, migrated.site.usefulLinks]);
  checks.push(["updates count", source.site.updates, migrated.site.updates]);
  checks.push(["popular guides count", source.site.popularGuides, migrated.site.popularGuides]);
  for (const sourceGuide of source.guides) {
    const target = migrated.guides.find((guide) => guide.slug === sourceGuide.slug);
    checks.push([`${sourceGuide.slug} title`, sourceGuide.title, target?.title]);
    checks.push([`${sourceGuide.slug} category`, sourceGuide.category, target?.category]);
    checks.push([`${sourceGuide.slug} status`, sourceGuide.status, target?.status]);
    checks.push([`${sourceGuide.slug} image count`, sourceGuide.images, target?.images]);
    checks.push([`${sourceGuide.slug} video count`, sourceGuide.videos, target?.videos]);
    checks.push([`${sourceGuide.slug} external image count`, sourceGuide.externalImages, target?.externalImages]);
    checks.push([`${sourceGuide.slug} text hash`, sourceGuide.textHash, target?.textHash]);
  }
  if (remote) {
    checks.push(["remote guide count", migrated.guides.length, remote.guides.length]);
    checks.push(["remote glossary count", migrated.glossary.length, remote.glossary.length]);
    checks.push(["remote useful links count", migrated.site.usefulLinks, remote.site.usefulLinks]);
    checks.push(["remote updates count", migrated.site.updates, remote.site.updates]);
    checks.push(["remote popular count", migrated.site.popularGuides, remote.site.popularGuides]);
  }
  const mismatches = checks
    .filter(([, expected, actual]) => JSON.stringify(expected) !== JSON.stringify(actual))
    .map(([name, expected, actual]) => ({ name, expected, actual }));
  return { ok: mismatches.length === 0, mismatches };
}

async function writeDocuments(client, migration) {
  const docs = [...migration.guides, ...migration.glossary, migration.siteSettings];
  for (let index = 0; index < docs.length; index += 50) {
    const tx = client.transaction();
    for (const doc of docs.slice(index, index + 50)) tx.createOrReplace(doc);
    await tx.commit();
  }
}

async function fetchMigratedDocuments(client) {
  return client.fetch(
    '{"guides": *[_type=="guide"]|order(order asc), "glossary": *[_type=="glossaryEntry"]|order(order asc), "siteSettings": *[_id=="siteSettings"][0]}',
  );
}

function sanityClient(withWrite) {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
  if (!projectId || !dataset) throw new Error("Missing Sanity projectId or dataset env vars.");
  const token = process.env.SANITY_API_WRITE_TOKEN;
  if (withWrite && !token) {
    return getCliClient({ projectId, dataset, apiVersion, useCdn: false, cwd: rootDir });
  }
  return createClient({ projectId, dataset, apiVersion, useCdn: false, token: withWrite ? token : undefined });
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

function countBlocks(blocks, type) {
  return blocks.filter((block) => block?._type === type).length;
}

function collectBlockLinks(blocks) {
  const links = [];
  for (const block of blocks.flatMap(expandNestedBlocks)) {
    if (block?._type === "block") links.push(...(block.markDefs ?? []).filter((mark) => mark._type === "link").map((mark) => mark.href));
    if (block?._type === "linkCard") links.push(block.href);
  }
  return links.filter(Boolean).sort();
}

function findAll(node, tagName) {
  const results = [];
  visit(node, (child) => {
    if (isElement(child, tagName)) results.push(child);
  });
  return results;
}

function findElement(node, tagName) {
  let result = null;
  visit(node, (child) => {
    if (!result && isElement(child, tagName)) result = child;
  });
  return result;
}

function visit(node, callback) {
  for (const child of node?.childNodes ?? []) {
    callback(child);
    visit(child, callback);
  }
}

function elementChildren(node) {
  return (node?.childNodes ?? []).filter((child) => !isBlankText(child));
}

function isElement(node, tagName) {
  return isElementNode(node) && node.tagName === tagName;
}

function isElementNode(node) {
  return Boolean(node?.tagName);
}

function isText(node) {
  return node?.nodeName === "#text";
}

function isBlankText(node) {
  return isText(node) && !node.value.trim();
}

function isHeading(node) {
  return isElementNode(node) && /^h[2-4]$/.test(node.tagName);
}

function headingStyle(tagName) {
  return /^h[2-4]$/.test(tagName) ? tagName : "normal";
}

function listItemType(node) {
  return getAttr(node, "data-list") || undefined;
}

function getAttr(node, name) {
  return node?.attrs?.find((attr) => attr.name === name)?.value;
}

function classList(node) {
  return (getAttr(node, "class") ?? "").split(/\s+/).filter(Boolean);
}

function textContent(node) {
  if (!node) return "";
  if (isText(node)) return node.value;
  if (isElement(node, "br")) return "\n";
  return (node.childNodes ?? []).map(textContent).join(" ");
}

function normalizeText(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function key(value) {
  return crypto.createHash("sha1").update(String(value)).digest("hex").slice(0, 12);
}

function hash(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function slugId(value) {
  return String(value)
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function withKeys(items, seed) {
  return items.map((item, index) => ({ ...item, _key: key(`${seed}-${index}-${JSON.stringify(item)}`) }));
}

function imageVariant(guideSlug) {
  if (guideSlug === "season-uniform") return "seasonUniform";
  if (guideSlug === "damage-buff" || guideSlug === "status-cleanse") return "portraitRanking";
  return "default";
}

function gridVariant(guideSlug) {
  if (guideSlug === "ctp") return "ctp";
  if (guideSlug === "season-uniform") return "seasonUniform";
  if (guideSlug === "artifact") return "artifact";
  if (guideSlug === "damage-buff" || guideSlug === "status-cleanse") return "buffList";
  if (guideSlug === "hero-selection") return "heroItemList";
  return "default";
}
