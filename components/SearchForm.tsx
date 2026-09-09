"use client";

import { useRouter } from "next/navigation";
import { FormEvent } from "react";

export function SearchForm({
  className = "hero-search",
  defaultValue = "",
  compact = false,
}: {
  className?: string;
  defaultValue?: string;
  compact?: boolean;
}) {
  const router = useRouter();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const q = String(formData.get("q") ?? "").trim();
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  }

  return (
    <form className={className} onSubmit={onSubmit}>
      <span className="search-glyph">⌕</span>
      <input name="q" type="search" defaultValue={defaultValue} placeholder="공략, 캐릭터, C.T.P., 콘텐츠, 용어를 검색해보세요." />
      {!compact && <button type="submit">검색</button>}
      {compact && (
        <button type="submit" aria-label="검색">
          ⌕
        </button>
      )}
    </form>
  );
}
