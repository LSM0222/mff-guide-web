import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { GuideArticle } from "@/components/GuideArticle";
import { Topbar } from "@/components/Topbar";
import { categoryLabel } from "@/content/utils";
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

  const category = categoryLabel(guide.category);
  const related = guides.filter((item) => item.category === guide.category && item.slug !== guide.slug && item.status === "published").slice(0, 3);
  const q = typeof queryParams.q === "string" ? queryParams.q : "";
  const section = typeof queryParams.section === "string" ? queryParams.section : "";

  return (
    <AppShell>
      <Topbar current={guide.title} />
      <div className="content-wrap">
        <header className="page-head">
          <span className="eyebrow">{category}</span>
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
                  <small>{categoryLabel(item.category)}</small>
                </Link>
              ))}
            </div>
          </section>
        )}
        <div className="article-footer">
          <Link href={`/guides?category=${guide.category}`}>← {category}</Link>
          <a href="#top">↑ 맨 위로</a>
        </div>
      </div>
    </AppShell>
  );
}
