"use client";

import { useEffect, useMemo, useState } from "react";
import type { GlossaryEntry } from "@/content/types";
import { normalizeSearch } from "@/content/search-utils";

export function GlossaryClient({ entries, initialTerm }: { entries: GlossaryEntry[]; initialTerm?: string }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const categories = useMemo(() => Array.from(new Set(entries.map((entry) => entry.category))), [entries]);

  useEffect(() => {
    if (!initialTerm) return;
    window.setTimeout(() => {
      const el = document.getElementById(initialTerm);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      if (el instanceof HTMLElement) {
        el.style.background = "rgba(108,79,220,.08)";
        window.setTimeout(() => {
          el.style.background = "";
        }, 1600);
      }
    }, 60);
  }, [initialTerm]);

  const normalizedQuery = normalizeSearch(query);

  return (
    <>
      <div className="glossary-tools">
        <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="용어를 검색해보세요." />
      </div>
      <div className="glossary-cats">
        <button className={`chip ${category === "all" ? "active" : ""}`} type="button" onClick={() => setCategory("all")}>
          전체
        </button>
        {categories.map((item) => (
          <button key={item} className={`chip ${category === item ? "active" : ""}`} type="button" onClick={() => setCategory(item)}>
            {item}
          </button>
        ))}
      </div>
      <div id="glossaryEntries">
        {categories.map((cat) => {
          const visible = entries.filter((entry) => {
            const okCategory = category === "all" || entry.category === category;
            const text = entry.searchText ?? `${entry.term} ${entry.category} ${entry.text}`;
            const okQuery = !normalizedQuery || normalizeSearch(text).includes(normalizedQuery);
            return entry.category === cat && okCategory && okQuery;
          });

          if (!visible.length) return null;

          return (
            <section data-gloss-cat={cat} key={cat}>
              <h2 className="glossary-cat-title">{cat}</h2>
              {visible.map((entry) => (
                <article className="glossary-entry" id={entry.id} key={entry.id} data-term={entry.searchText}>
                  <h3>{entry.term}</h3>
                  <div className="article" dangerouslySetInnerHTML={{ __html: entry.html }} />
                </article>
              ))}
            </section>
          );
        })}
      </div>
    </>
  );
}
