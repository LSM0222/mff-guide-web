"use client";

import { useEffect, useState } from "react";

function markPortrait(img: HTMLImageElement) {
  const figure = img.closest("figure");
  if (!figure || !img.naturalWidth || !img.naturalHeight) return;
  figure.classList.toggle("is-portrait", img.naturalHeight / img.naturalWidth > 1.45);
}

function highlightFirstText(root: HTMLElement, query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) return null;

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.nodeValue?.trim()) return NodeFilter.FILTER_REJECT;
      const parent = node.parentElement;
      if (!parent || parent.closest("script,style,mark.search-hit")) return NodeFilter.FILTER_REJECT;
      return node.nodeValue.toLowerCase().includes(needle) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
    },
  });

  const node = walker.nextNode();
  if (!node?.nodeValue) return null;
  const index = node.nodeValue.toLowerCase().indexOf(needle);
  const textNode = node as Text;
  const hitText = textNode.splitText(index);
  hitText.splitText(needle.length);
  const mark = document.createElement("mark");
  mark.className = "search-hit";
  mark.textContent = hitText.nodeValue;
  hitText.replaceWith(mark);
  return mark;
}

function scrollToQuery(query: string) {
  const root = document.getElementById("articleRoot");
  if (!root || !query) return;

  root.querySelectorAll(".search-hit").forEach((el) => el.replaceWith(document.createTextNode(el.textContent ?? "")));
  root.querySelectorAll(".search-hit-block").forEach((el) => el.classList.remove("search-hit-block"));

  const words = query.split(/\s+/).filter(Boolean);
  const hit = highlightFirstText(root, query) || (words.length ? highlightFirstText(root, words[0]) : null);
  if (!hit) return;

  let detail = hit.parentElement?.closest("details");
  while (detail) {
    detail.open = true;
    detail = detail.parentElement?.closest("details");
  }

  const block = hit.closest("p,li,h2,h3,h4,summary,.callout-body,figcaption") ?? hit.parentElement;
  block?.classList.add("search-hit-block");
  window.setTimeout(() => hit.scrollIntoView({ behavior: "smooth", block: "center" }), 30);
}

function scrollToSection(section: string) {
  if (!section) return;
  const element = document.getElementById(section);
  element?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function ArticleEnhancer({ query, section }: { query: string; section: string }) {
  const [lightbox, setLightbox] = useState<{ src: string; alt: string; caption: string } | null>(null);

  useEffect(() => {
    const root = document.getElementById("articleRoot");
    if (!root) return;

    const imgs = Array.from(root.querySelectorAll<HTMLImageElement>("figure.media-asset.image img"));
    imgs.forEach((img) => {
      if (img.complete) markPortrait(img);
      else img.addEventListener("load", () => markPortrait(img), { once: true });
    });

    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLImageElement) || !target.matches("figure.media-asset.image img")) return;
      event.preventDefault();
      event.stopPropagation();
      const src = (target.currentSrc || target.src).trim();
      if (!src) return;
      setLightbox({
        src,
        alt: target.alt || "",
        caption: target.closest("figure")?.querySelector("figcaption")?.textContent?.trim() || target.alt || "",
      });
    };

    root.addEventListener("click", onClick);
    return () => root.removeEventListener("click", onClick);
  }, []);

  useEffect(() => {
    if (section) window.setTimeout(() => scrollToSection(section), 60);
    else if (query) window.setTimeout(() => scrollToQuery(query), 90);
  }, [query, section]);

  const lightboxSrc = lightbox?.src.trim() ?? "";
  const isLightboxOpen = Boolean(lightboxSrc);

  useEffect(() => {
    document.body.classList.toggle("lightbox-lock", isLightboxOpen);
    if (!isLightboxOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLightbox(null);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.classList.remove("lightbox-lock");
    };
  }, [isLightboxOpen]);

  if (!lightbox || !lightboxSrc) return null;

  return (
    <div className="image-lightbox show" aria-hidden={false} onClick={() => setLightbox(null)}>
      <button className="image-lightbox-close" type="button" aria-label="닫기" onClick={() => setLightbox(null)}>
        ×
      </button>
      <figure onClick={(event) => event.stopPropagation()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={lightboxSrc} alt={lightbox.alt} />
        {lightbox.caption ? <figcaption>{lightbox.caption}</figcaption> : null}
      </figure>
    </div>
  );
}
