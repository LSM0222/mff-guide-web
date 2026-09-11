"use client";

import { Children, type ReactNode, useCallback, useEffect, useRef, useState } from "react";

type HorizontalGuideRowProps = {
  ariaLabel: string;
  children: ReactNode;
  className?: string;
};

type ScrollState = {
  canScroll: boolean;
  atStart: boolean;
  atEnd: boolean;
};

export function HorizontalGuideRow({ ariaLabel, children, className = "" }: HorizontalGuideRowProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [scrollState, setScrollState] = useState<ScrollState>({
    canScroll: false,
    atStart: true,
    atEnd: true,
  });
  const itemCount = Children.count(children);

  const updateScrollState = useCallback(() => {
    const viewport = viewportRef.current;

    if (!viewport) {
      return;
    }

    const maxScroll = viewport.scrollWidth - viewport.clientWidth;
    const canScroll = maxScroll > 1;
    const scrollLeft = Math.max(0, viewport.scrollLeft);

    setScrollState({
      canScroll,
      atStart: scrollLeft <= 1,
      atEnd: !canScroll || scrollLeft >= maxScroll - 1,
    });
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;

    if (!viewport) {
      return;
    }

    updateScrollState();

    const resizeObserver = new ResizeObserver(updateScrollState);
    resizeObserver.observe(viewport);

    for (const child of Array.from(viewport.children)) {
      resizeObserver.observe(child);
    }

    window.addEventListener("resize", updateScrollState);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateScrollState);
    };
  }, [itemCount, updateScrollState]);

  const scrollByCards = (direction: -1 | 1) => {
    const viewport = viewportRef.current;

    if (!viewport) {
      return;
    }

    const firstCard = viewport.firstElementChild as HTMLElement | null;
    const cardWidth = firstCard?.offsetWidth ?? 260;
    const step = Math.min(cardWidth * 2, viewport.clientWidth * 0.82);

    viewport.scrollBy({
      left: direction * step,
      behavior: "smooth",
    });
  };

  return (
    <div className={`horizontal-guide-row ${className}`.trim()}>
      {scrollState.canScroll && (
        <div className="guide-row-controls">
          <button type="button" aria-label="이전 공략" disabled={scrollState.atStart} onClick={() => scrollByCards(-1)}>
            ‹
          </button>
          <button type="button" aria-label="다음 공략" disabled={scrollState.atEnd} onClick={() => scrollByCards(1)}>
            ›
          </button>
        </div>
      )}
      <div className="guide-row-viewport" ref={viewportRef} onScroll={updateScrollState} aria-label={ariaLabel}>
        {children}
      </div>
    </div>
  );
}
