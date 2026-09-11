import { toHTML } from "@portabletext/to-html";
import type { TypedObject } from "@portabletext/types";
import { needsNoReferrerPolicy } from "@/lib/imageReferrerPolicy";

type CmsBlock = Record<string, unknown> & { _type?: string };
type PortableComponentProps = {
  children?: string;
  value?: unknown;
};

type SpanChild = {
  text?: string;
};

type TableRow = {
  cells?: string[];
};

type RenderContext = {
  footnoteIndex: number;
};

type RepeatedItem = {
  title?: string;
  image?: CmsBlock;
  content?: CmsBlock[];
};

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function mediaSrc(block: CmsBlock) {
  return stringValue(block.legacySrc || block.externalSrc || block.assetUrl);
}

export function renderGuideHtml(guide: CmsBlock): string {
  const context: RenderContext = { footnoteIndex: 0 };
  const body = renderBlocksWithContext(blockArray(guide.body), context);
  const sections = blockArray(guide.sections)
    .map((section) => {
      const anchor = currentSlug(section.anchor);
      const level = Math.max(2, Math.min(4, Number(section.level ?? 3)));
      const heading = `h${level}`;
      const depth = `depth-${level - 1}`;
      const anchorAttrs = anchor ? ` data-section-anchor="${escapeHtml(anchor)}"` : "";
      const headingAttrs = anchor ? ` id="${escapeHtml(anchor)}"` : "";
      return `<section class="article-subsection ${depth}"${anchorAttrs}><${heading}${headingAttrs}>${escapeHtml(section.title)}</${heading}>${renderBlocksWithContext(blockArray(section.blocks), context)}</section>`;
    })
    .join("");
  return `${body}${sections}`;
}

export function renderBlocks(blocks: CmsBlock[] = []): string {
  return renderBlocksWithContext(blocks, { footnoteIndex: 0 });
}

export function blocksToText(blocks: CmsBlock[] = []): string {
  const parts: string[] = [];
  for (const block of blocks) {
    if (!block) continue;
    if (block._type === "block") parts.push(blockArray(block.children).map((child) => stringValue((child as SpanChild).text)).join(""));
    if (block._type === "contentImage") parts.push(stringValue(block.caption || block.alt));
    if (block._type === "contentVideo") parts.push(stringValue(block.caption));
    if (block._type === "callout" || block._type === "detailsBlock") parts.push(blocksToText(blockArray(block.content)));
    if (block._type === "contentTable") {
      const rows = blockArray(block.rows) as TableRow[];
      parts.push([...stringArray(block.headers), ...rows.flatMap((row) => row.cells ?? [])].join(" "));
    }
    if (block._type === "repeatedItemGrid") {
      for (const item of blockArray(block.items) as RepeatedItem[]) {
        parts.push([item.title, item.image?.caption, item.image?.alt, blocksToText(item.content ?? [])].filter(Boolean).join(" "));
      }
    }
    if (block._type === "linkCard") parts.push(stringValue(block.label));
  }
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

function renderImage(block: CmsBlock): string {
  const src = mediaSrc(block);
  if (!src) return "";
  const referrerPolicy = needsNoReferrerPolicy(src) ? ' referrerpolicy="no-referrer"' : "";
  return `<figure class="media-asset image"><img alt="${escapeHtml(block.alt || block.caption || "")}" loading="lazy" src="${escapeHtml(src)}"${referrerPolicy}/>${block.caption ? `<figcaption>${escapeHtml(block.caption)}</figcaption>` : ""}</figure>`;
}

function renderVideo(block: CmsBlock): string {
  const src = mediaSrc(block);
  if (!src) return "";
  return `<figure class="media-asset video"><video controls preload="metadata" src="${escapeHtml(src)}"></video>${block.caption ? `<figcaption>${escapeHtml(block.caption)}</figcaption>` : ""}</figure>`;
}

function renderBlocksWithContext(blocks: CmsBlock[] = [], context: RenderContext): string {
  return toHTML(blocks as TypedObject[], { components: portableComponents(context), onMissingComponent: false });
}

function portableComponents(context: RenderContext) {
  return {
    marks: {
      link: ({ children = "", value }: PortableComponentProps) => renderLink(children, asBlock(value)),
      highlight: ({ children = "" }: PortableComponentProps) => `<mark>${children}</mark>`,
      "strike-through": ({ children = "" }: PortableComponentProps) => `<del>${children}</del>`,
      footnote: ({ children = "", value }: PortableComponentProps) => renderFootnote(children, asBlock(value), context),
    },
    types: {
      contentImage: ({ value }: PortableComponentProps) => renderImage(asBlock(value)),
      contentVideo: ({ value }: PortableComponentProps) => renderVideo(asBlock(value)),
      callout: ({ value }: PortableComponentProps) => renderCallout(asBlock(value), context),
      contentTable: ({ value }: PortableComponentProps) => renderTable(asBlock(value)),
      detailsBlock: ({ value }: PortableComponentProps) => renderDetails(asBlock(value), context),
      repeatedItemGrid: ({ value }: PortableComponentProps) => renderRepeatedGrid(asBlock(value), context),
      dividerBlock: () => "<hr/>",
      linkCard: ({ value }: PortableComponentProps) => `<div class="link-card"><a href="${escapeHtml(asBlock(value).href)}">${escapeHtml(asBlock(value).label)}</a></div>`,
    },
    block: {
      normal: ({ children = "", value }: PortableComponentProps) => `<p${textAlignClassAttr(asBlock(value))}>${children}</p>`,
      h2: ({ children = "", value }: PortableComponentProps) => `<h2${idAttr(asBlock(value))}${textAlignClassAttr(asBlock(value))}>${children}</h2>`,
      h3: ({ children = "", value }: PortableComponentProps) => `<h3${idAttr(asBlock(value))}${textAlignClassAttr(asBlock(value))}>${children}</h3>`,
      h4: ({ children = "", value }: PortableComponentProps) => `<h4${idAttr(asBlock(value))}${textAlignClassAttr(asBlock(value))}>${children}</h4>`,
    },
    list: {
      bullet: ({ children = "" }: PortableComponentProps) => `<ul>${children}</ul>`,
      number: ({ children = "" }: PortableComponentProps) => `<ol>${children}</ol>`,
    },
    listItem: {
      bullet: ({ children = "" }: PortableComponentProps) => `<li>${children}</li>`,
      number: ({ children = "" }: PortableComponentProps) => `<li>${children}</li>`,
    },
  };
}

function renderLink(children: string, block: CmsBlock): string {
  const href = normalizeInternalGuideHref(stringValue(block.href).trim());
  if (!href) return children;
  const externalAttrs = isExternalHref(href) ? ' target="_blank" rel="noopener noreferrer"' : "";
  return `<a href="${escapeHtml(href)}"${externalAttrs}>${children}</a>`;
}

function renderFootnote(children: string, block: CmsBlock, context: RenderContext): string {
  const content = stringValue(block.content).trim();
  if (!content) return children;
  const number = ++context.footnoteIndex;
  const popoverId = `footnote-popover-${number}`;
  return `${children}<button class="footnote-marker" type="button" data-footnote-number="${number}" data-footnote-content="${escapeHtml(content)}" aria-label="각주 ${number} 보기" aria-expanded="false" aria-controls="${popoverId}">${number}</button>`;
}

function renderCallout(block: CmsBlock, context: RenderContext): string {
  const icon = block.variant === "danger" ? "!" : block.variant === "neutral" ? "•" : "i";
  return `<div class="callout ${escapeHtml(block.variant || "info")}"><div class="callout-icon">${icon}</div><div class="callout-body">${renderBlocksWithContext(blockArray(block.content), context)}</div></div>`;
}

function renderTable(block: CmsBlock): string {
  const headersList = stringArray(block.headers);
  const headers = headersList.length ? `<tr>${headersList.map((cell) => `<th>${escapeHtml(cell)}</th>`).join("")}</tr>` : "";
  const rows = (blockArray(block.rows) as TableRow[]).map((row) => `<tr>${(row.cells ?? []).map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("");
  return `<div class="table-wrap"><table>${headers}${rows}</table></div>`;
}

function renderDetails(block: CmsBlock, context: RenderContext): string {
  return `<details><summary>${escapeHtml(block.summary)}</summary>${renderBlocksWithContext(blockArray(block.content), context)}</details>`;
}

function renderRepeatedGrid(block: CmsBlock, context: RenderContext): string {
  const items: string = (blockArray(block.items) as RepeatedItem[])
    .map((item) => `<div class="content-column">${item.image ? renderImage(item.image) : ""}${renderBlocksWithContext(item.content ?? [], context)}</div>`)
    .join("");
  return `<div class="content-columns" data-variant="${escapeHtml(block.variant || "default")}">${items}</div>`;
}

function idAttr(value: CmsBlock) {
  const textId = slugId(blockText(value));
  const id = textId || stringValue(value?._key);
  const blockKey = textId && value?._key ? ` data-block-key="${escapeHtml(value._key)}"` : "";
  return id ? ` id="${escapeHtml(id)}"${blockKey}` : "";
}

function textAlignClassAttr(value: CmsBlock) {
  return value.textAlign === "center" ? ' class="text-align-center"' : "";
}

function blockArray(value: unknown): CmsBlock[] {
  return Array.isArray(value) ? (value as CmsBlock[]) : [];
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map(stringValue) : [];
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function blockText(value: CmsBlock): string {
  return blockArray(value.children)
    .map((child) => stringValue((child as SpanChild).text))
    .join("")
    .trim();
}

function slugId(value: string): string {
  return value
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function isExternalHref(href: string): boolean {
  return /^https?:\/\//i.test(href);
}

function normalizeInternalGuideHref(href: string): string {
  const match = href.match(/^(\/guides\/[^?#]+)\?section=([^&#]+)$/);
  if (!match) return href;
  return `${match[1]}#${safeDecodeURIComponent(match[2])}`;
}

function safeDecodeURIComponent(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function currentSlug(value: unknown): string {
  if (!value || typeof value !== "object") return "";
  const current = (value as { current?: unknown }).current;
  return stringValue(current);
}

function asBlock(value: unknown): CmsBlock {
  return value && typeof value === "object" ? (value as CmsBlock) : {};
}
