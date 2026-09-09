import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { SearchForm } from "@/components/SearchForm";
import { Topbar } from "@/components/Topbar";
import { searchData } from "@/content/utils";

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const results = searchData(q);

  return (
    <AppShell>
      <Topbar current="검색" />
      <div className="content-wrap">
        <header className="page-head">
          <span className="eyebrow">SEARCH</span>
          <h1 className="search-title">통합 검색</h1>
          <p>공략 제목과 본문, 별칭, 퓨파 용어 사전을 함께 검색합니다.</p>
        </header>
        <SearchForm defaultValue={q} />
        <div className="search-summary">{q ? `‘${q}’ 검색 결과 ${results.length}개` : "검색어를 입력해보세요."}</div>
        {q &&
          (results.length ? (
            results.map((result) => (
              <Link className="search-result" href={result.route} key={`${result.type}-${result.title}`}>
                <div className="type">
                  {result.type}
                  {result.coming ? " · 준비중" : ""}
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
