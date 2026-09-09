/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const sourcePath = path.resolve(root, "..", "mff_guide_full_prototype_v14_lightbox.html");
const contentRoot = path.join(root, "content");
const publicMediaRoot = path.join(root, "public", "media");

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
    if (char === "{" || char === "[") depth += 1;
    else if (char === "}" || char === "]") {
      depth -= 1;
      if (depth === 0) return source.slice(start, index + 1);
    }
  }
  throw new Error(`Unterminated value after marker: ${marker}`);
}

function countMatches(text, pattern) {
  return (text.match(pattern) || []).length;
}

function audit(data) {
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

function readGeneratedData() {
  const indexSource = fs.readFileSync(path.join(contentRoot, "index.ts"), "utf8");
  const orderedGuideFiles = Array.from(indexSource.matchAll(/from "\.\/guides\/([^"]+)"/g), (match) => `${match[1]}.ts`);
  const guides = orderedGuideFiles
    .map((file) => {
      const source = fs.readFileSync(path.join(contentRoot, "guides", file), "utf8");
      return JSON.parse(extractBalanced(source, "= "));
    });
  const glossarySource = fs.readFileSync(path.join(contentRoot, "glossary.ts"), "utf8");
  const glossary = JSON.parse(extractBalanced(glossarySource, "= "));
  return { guides, glossary };
}

function localMediaRefs(data) {
  const html = [
    ...data.guides.map((guide) => guide.html || ""),
    ...data.glossary.map((entry) => entry.html || ""),
  ].join("\n");
  return Array.from(html.matchAll(/\b(?:src|href)="(\/media\/[^"]+)"/g), (match) => decodeURIComponent(match[1].slice("/media/".length)));
}

function main() {
  const source = fs.readFileSync(sourcePath, "utf8");
  const v14 = JSON.parse(extractBalanced(source, "const DATA="));
  const generated = readGeneratedData();

  const v14Audit = audit(v14);
  const generatedAudit = audit(generated);
  const missingLocalMedia = Array.from(new Set(localMediaRefs(generated))).filter((ref) => !fs.existsSync(path.join(publicMediaRoot, ref)));
  const report = {
    v14: v14Audit,
    generated: generatedAudit,
    matches: JSON.stringify(v14Audit) === JSON.stringify(generatedAudit),
    missingLocalMedia,
  };

  fs.writeFileSync(path.join(root, "content-audit.report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(report, null, 2));
  if (!report.matches || missingLocalMedia.length) process.exitCode = 1;
}

main();
