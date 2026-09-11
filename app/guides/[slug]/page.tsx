import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { GuideArticle } from "@/components/GuideArticle";
import { Topbar } from "@/components/Topbar";
import { categoryContainsGuide, primaryGuideCategory, primaryGuideCategoryLabel } from "@/content/guide-taxonomy";
import { getGuideBySlug, getGuides } from "@/sanity/lib/content";
import { createRouteMetadata } from "../../seo";

export async function generateStaticParams() {
  const guides = await getGuides();
  return guides.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({ params }: PageProps<"/guides/[slug]">) {
  const { slug } = await params;
  return createRouteMetadata(`/guides/${slug}`);
}

export default async function GuideDetailPage({ params, searchParams }: PageProps<"/guides/[slug]">) {
  const { slug } = await params;
  const queryParams = await searchParams;
  const [guide, guides] = await Promise.all([getGuideBySlug(slug), getGuides()]);
  if (!guide) notFound();

  const category = primaryGuideCategory(guide);
  const categoryName = primaryGuideCategoryLabel(guide);
  const related = category
    ? guides.filter((item) => categoryContainsGuide(category, item.slug) && item.slug !== guide.slug && item.status === "published").slice(0, 3)
    : [];
  const q = typeof queryParams.q === "string" ? queryParams.q : "";
  const section = typeof queryParams.section === "string" ? queryParams.section : "";

  return (
    <AppShell>
      <Topbar current={guide.title} />
      <div className="content-wrap">
        <header className="page-head">
          <span className="eyebrow">{categoryName}</span>
          <h1>{guide.title}</h1>
          <p>{guide.description}</p>
          <div className="source-note">Notion 원본 공략 기반 · 사진과 동영상은 현재 자리 표시자로 표기</div>
        </header>
        {guide.status === "coming" ? (
          <div className="search-empty">이 공략은 현재 준비 중입니다. 목록에서는 팝업으로 안내됩니다.</div>
        ) : (
          <GuideArticle guide={guide} query={q} section={section} />
        )}
        {related.length > 0 && (
          <section className="related">
            <h3>같은 분류의 다른 공략</h3>
            <div className="related-grid">
              {related.map((item) => (
                <Link href={`/guides/${item.slug}`} key={item.slug}>
                  {item.title}
                  <small>{primaryGuideCategoryLabel(item)}</small>
                </Link>
              ))}
            </div>
          </section>
        )}
        <section className="ad-placeholder ad-placeholder-horizontal content-bottom-ad" aria-label="광고 영역">
          <span className="ad-label">광고</span>
          <div className="ad-placeholder-body">
            <strong>광고 영역</strong>
            <span>본문 하단 가로형 슬롯</span>
          </div>
        </section>
        <div className="article-footer">
          <Link href={category ? `/guides?category=${category.id}` : "/guides"}>← {categoryName}</Link>
          <a href="#top">↑ 맨 위로</a>
        </div>
      </div>
    </AppShell>
  );
}
