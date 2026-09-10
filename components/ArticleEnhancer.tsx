"use client";

import { useEffect, useRef, useState } from "react";
import { needsNoReferrerPolicy } from "@/lib/imageReferrerPolicy";

type FootnoteState = {
  number: string;
  content: string;
  top: number;
  left: number;
  placement: "above" | "below";
};

type LightboxState = {
  src: string;
  alt: string;
  caption: string;
  referrerPolicy?: "no-referrer";
};

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
      if (!parent || parent.closest("script,style,button.footnote-marker,.footnote-popover,mark.search-hit")) return NodeFilter.FILTER_REJECT;
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
  const [lightbox, setLightbox] = useState<LightboxState | null>(null);
  const [footnote, setFootnote] = useState<FootnoteState | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = document.getElementById("articleRoot");
    if (!root) return;

    const imgs = Array.from(root.querySelectorAll<HTMLImageElement>("figure.media-asset.image img"));
    imgs.forEach((img) => {
      if (needsNoReferrerPolicy(img.currentSrc || img.src || img.getAttribute("src") || "")) {
        img.referrerPolicy = "no-referrer";
      }
      if (img.complete) markPortrait(img);
      else img.addEventListener("load", () => markPortrait(img), { once: true });
    });

    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (target instanceof HTMLElement) {
        const marker = target.closest<HTMLButtonElement>("button.footnote-marker");
        if (marker) {
          event.preventDefault();
          event.stopPropagation();
          setFootnote((current) => {
            const number = marker.dataset.footnoteNumber ?? "";
            if (current?.number === number) return null;
            return footnoteFromMarker(marker);
          });
          return;
        }
      }

      if (!(target instanceof HTMLImageElement) || !target.matches("figure.media-asset.image img")) return;
      event.preventDefault();
      event.stopPropagation();
      const src = (target.currentSrc || target.src).trim();
      if (!src) return;
      setLightbox({
        src,
        alt: target.alt || "",
        caption: target.closest("figure")?.querySelector("figcaption")?.textContent?.trim() || target.alt || "",
        referrerPolicy: needsNoReferrerPolicy(src) ? "no-referrer" : undefined,
      });
    };

    root.addEventListener("click", onClick);
    return () => root.removeEventListener("click", onClick);
  }, []);

  useEffect(() => {
    const root = document.getElementById("articleRoot");
    if (!root) return;
    const markers = Array.from(root.querySelectorAll<HTMLButtonElement>("button.footnote-marker"));
    markers.forEach((marker) => {
      const isOpen = Boolean(footnote && marker.dataset.footnoteNumber === footnote.number);
      marker.setAttribute("aria-expanded", String(isOpen));
      marker.classList.toggle("is-open", isOpen);
    });
  }, [footnote]);

  useEffect(() => {
    if (!footnote) return;

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (popoverRef.current?.contains(target)) return;
      if (target instanceof HTMLElement && target.closest("button.footnote-marker")) return;
      setFootnote(null);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFootnote(null);
    };

    const onReposition = () => {
      const marker = document.querySelector<HTMLButtonElement>(`button.footnote-marker[data-footnote-number="${CSS.escape(footnote.number)}"]`);
      if (marker) setFootnote(footnoteFromMarker(marker));
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
    };
  }, [footnote]);

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

  if (!isLightboxOpen && !footnote) return null;

  return (
    <>
      {footnote ? (
        <div
          ref={popoverRef}
          id={`footnote-popover-${footnote.number}`}
          className={`footnote-popover ${footnote.placement}`}
          role="dialog"
          aria-label={`각주 ${footnote.number}`}
          style={{ top: footnote.top, left: footnote.left }}
        >
          <div className="footnote-popover-head">
            <span>{footnote.number}</span>
            <button type="button" aria-label="각주 닫기" onClick={() => setFootnote(null)}>
              ×
            </button>
          </div>
          <p>{footnote.content}</p>
        </div>
      ) : null}
      {lightbox && lightboxSrc ? (
        <div className="image-lightbox show" aria-hidden={false} onClick={() => setLightbox(null)}>
          <button className="image-lightbox-close" type="button" aria-label="닫기" onClick={() => setLightbox(null)}>
            ×
          </button>
          <figure onClick={(event) => event.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={lightboxSrc} alt={lightbox.alt} referrerPolicy={lightbox.referrerPolicy} />
            {lightbox.caption ? <figcaption>{lightbox.caption}</figcaption> : null}
          </figure>
        </div>
      ) : null}
    </>
  );
}

function footnoteFromMarker(marker: HTMLButtonElement): FootnoteState {
  const rect = marker.getBoundingClientRect();
  const isMobile = window.innerWidth <= 560;
  const width = Math.min(isMobile ? window.innerWidth - 24 : 280, 280);
  const estimatedHeight = 150;
  const belowTop = rect.bottom + 8;
  const fitsBelow = belowTop + estimatedHeight <= window.innerHeight - 12;
  const placement = fitsBelow || rect.top < estimatedHeight ? "below" : "above";
  const top = placement === "below" ? belowTop : Math.max(12, rect.top - estimatedHeight - 8);
  const centeredLeft = isMobile ? (window.innerWidth - width) / 2 : rect.left + rect.width / 2 - width / 2;
  const left = Math.max(12, Math.min(centeredLeft, window.innerWidth - width - 12));

  return {
    number: marker.dataset.footnoteNumber ?? "",
    content: marker.dataset.footnoteContent ?? "",
    top,
    left,
    placement,
  };
}
