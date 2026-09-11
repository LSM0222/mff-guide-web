"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect } from "react";

export function ClientChrome() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    document.body.classList.remove("drawer-open");
    const activeCategory = searchParams.get("category");
    document.querySelectorAll<HTMLElement>(".nav a[data-nav]").forEach((link) => {
      const key = link.dataset.nav;
      const active =
        (key === "home" && pathname === "/") ||
        (pathname === "/guides" && activeCategory === key);
      link.classList.toggle("active", active);
    });
  }, [pathname, searchParams]);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const q = String(formData.get("q") ?? "").trim();
    if (q) router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <>
      <header className="mobile-head">
        <button className="menu-btn" type="button" aria-label="메뉴 열기" onClick={() => document.body.classList.add("drawer-open")}>
          ☰
        </button>
        <Link className="mbrand" href="/">
          겁쟁이들의<span>쉼터</span>
        </Link>
        <form className="mobile-search" onSubmit={submitSearch}>
          <input name="q" aria-label="검색어" />
          <button className="search-btn" type="submit" aria-label="검색">
            ⌕
          </button>
        </form>
      </header>
      <button className="drawer-overlay" type="button" aria-label="메뉴 닫기" onClick={() => document.body.classList.remove("drawer-open")} />
      <nav className={`floating-nav ${pathname.startsWith("/guides/") ? "show-home" : ""}`} aria-label="빠른 이동">
        <Link className="floating-action floating-home" href="/" aria-label="홈으로 이동" title="홈">
          ⌂<span>홈</span>
        </Link>
        <button className="floating-action" type="button" aria-label="맨 위로 이동" title="맨 위로" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          ↑<span>TOP</span>
        </button>
      </nav>
    </>
  );
}
