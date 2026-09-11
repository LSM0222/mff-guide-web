"use client";

import { useRouter } from "next/navigation";
import { FormEvent } from "react";
import { normalizeSearchScope, type SearchScope } from "@/content/search-utils";

const scopeLabels: Record<SearchScope, string> = {
  title: "제목",
  all: "제목 + 본문",
  body: "본문",
};

export function SearchForm({
  className = "hero-search",
  defaultValue = "",
  defaultScope = "title",
  compact = false,
}: {
  className?: string;
  defaultValue?: string;
  defaultScope?: SearchScope;
  compact?: boolean;
}) {
  const router = useRouter();
  const scope = normalizeSearchScope(defaultScope);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const q = String(formData.get("q") ?? "").trim();
    const nextScope = normalizeSearchScope(formData.get("scope"));
    router.push(q ? `/search?q=${encodeURIComponent(q)}&scope=${nextScope}` : `/search?scope=${nextScope}`);
  }

  return (
    <form className={className} onSubmit={onSubmit}>
      <div className="search-input-row">
        <span className="search-glyph">⌕</span>
        <input name="q" type="search" defaultValue={defaultValue} placeholder="공략, 캐릭터, C.T.P., 콘텐츠, 용어를 검색해보세요." />
        {!compact && <button type="submit">검색</button>}
        {compact && (
          <>
            <input type="hidden" name="scope" value="title" />
            <button type="submit" aria-label="검색">
              ⌕
            </button>
          </>
        )}
      </div>
      {!compact && (
        <fieldset className="search-scope" aria-label="검색 범위">
          {(Object.keys(scopeLabels) as SearchScope[]).map((value) => (
            <label key={value}>
              <input type="radio" name="scope" value={value} defaultChecked={scope === value} />
              <span>{scopeLabels[value]}</span>
            </label>
          ))}
        </fieldset>
      )}
    </form>
  );
}
