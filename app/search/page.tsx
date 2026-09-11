import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { SearchForm } from "@/components/SearchForm";
import { Topbar } from "@/components/Topbar";
import { normalizeSearchScope } from "@/content/search-utils";
import { searchSanityData } from "@/sanity/lib/content";
import { SITE_DESCRIPTION, SITE_TITLE } from "../seo";

export const metadata: Metadata = {
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  robots: {
    index: false,
    follow: true,
  },
};

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const scope = normalizeSearchScope(params.scope);
  const results = await searchSanityData(q, scope);

  return (
    <AppShell>
      <Topbar current="검색" />
      <div className="content-wrap">
        <header className="page-head">
          <span className="eyebrow">SEARCH</span>
          <h1 className="search-title">통합 검색</h1>
          <p>검색 범위를 선택해 공략 제목과 본문을 필요한 만큼만 찾아보세요.</p>
        </header>
        <SearchForm key={`${q}-${scope}`} defaultValue={q} defaultScope={scope} />
        <div className="search-summary">{q ? `‘${q}’ ${scopeLabel(scope)} 검색 결과 ${results.length}개` : "검색어를 입력해보세요."}</div>
        {q &&
          (results.length ? (
            results.map((result) => (
              <Link className="search-result" href={result.route} key={`${result.type}-${result.title}-${result.route}`}>
                <div className="type">
                  {result.type}
                  {"coming" in result && result.coming ? " · 준비중" : ""}
                  {result.match === "body" ? " · 본문" : result.match === "title" ? " · 제목" : ""}
                </div>
                <h3>{result.title}</h3>
                <p>{result.desc}</p>
              </Link>
            ))
          ) : (
            <div className="search-empty">검색 결과가 없습니다.</div>
          ))}
      </div>
    </AppShell>
  );
}

function scopeLabel(scope: "title" | "all" | "body") {
  if (scope === "all") return "제목 + 본문";
  if (scope === "body") return "본문";
  return "제목";
}
