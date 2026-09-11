import Link from "next/link";
import type { ReactNode } from "react";
import { AppShell } from "@/components/AppShell";
import { GuideListCard } from "@/components/GuideCards";
import { HorizontalGuideRow } from "@/components/HorizontalGuideRow";
import { Topbar } from "@/components/Topbar";
import { categoryDescription, categoryLabel } from "@/content/utils";
import { getGuideCategory, guideCategories, guidesForSlugs, type GuideSpecialLink } from "@/content/guide-taxonomy";
import { getGuides } from "@/sanity/lib/content";
import { createRouteMetadata } from "../seo";

export const metadata = createRouteMetadata("/guides");

export default async function GuidesPage({ searchParams }: PageProps<"/guides">) {
  const params = await searchParams;
  const requestedCategory = typeof params.category === "string" ? params.category : undefined;
  const selectedCategory = getGuideCategory(requestedCategory);
  const category = selectedCategory?.id;
  const guides = await getGuides();
  const items = selectedCategory ? guidesForSlugs(guides, selectedCategory.guideSlugs) : guides;
  const title = category ? categoryLabel(category) : "전체 공략";
  const subcategoryCount =
    selectedCategory?.subcategories?.reduce((count, subcategory) => count + guidesForSlugs(guides, subcategory.guideSlugs).length + (subcategory.specialLinks?.length ?? 0), 0) ?? 0;
  const specialLinkCount = selectedCategory?.specialLinks?.length ?? 0;
  const totalCount = items.length + subcategoryCount + specialLinkCount;

  return (
    <AppShell>
      <Topbar current={title} />
      <div className="content-wrap">
        <header className="page-head">
          <span className="eyebrow">GUIDES</span>
          <h1>{title}</h1>
          <p>{categoryDescription(category)}</p>
        </header>
        <div className="list-head">
          <div className="filter-chips">
            <Link className={`chip ${!category ? "active" : ""}`} href="/guides">
              전체
            </Link>
            {guideCategories.map((item) => (
              <Link key={item.id} className={`chip ${category === item.id ? "active" : ""}`} href={`/guides?category=${item.id}`}>
                {item.label}
              </Link>
            ))}
          </div>
          <span className="source-note">{totalCount}개 항목</span>
        </div>
        {selectedCategory ? (
          <div className="guide-category-stack">
            <GuideGrid title="일반 guide">
              {items.map((guide) => (
                <GuideListCard guide={guide} key={guide.slug} />
              ))}
              {(selectedCategory.specialLinks ?? []).map((link) => (
                <SpecialLinkCard link={link} key={link.href} />
              ))}
            </GuideGrid>
            {(selectedCategory.subcategories ?? []).map((subcategory) => (
              <GuideGrid title={subcategory.label} key={subcategory.id}>
                {guidesForSlugs(guides, subcategory.guideSlugs).map((guide) => (
                  <GuideListCard guide={guide} key={guide.slug} />
                ))}
                {(subcategory.specialLinks ?? []).map((link) => (
                  <SpecialLinkCard link={link} key={link.href} />
                ))}
              </GuideGrid>
            ))}
          </div>
        ) : (
          <div className="guide-list-grid">
            {items.map((guide) => (
              <GuideListCard guide={guide} key={guide.slug} />
            ))}
          </div>
        )}
        <section className="ad-placeholder ad-placeholder-horizontal content-bottom-ad" aria-label="광고 영역">
          <span className="ad-label">광고</span>
          <div className="ad-placeholder-body">
            <strong>광고 영역</strong>
            <span>공략 목록 하단 가로형 슬롯</span>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function GuideGrid({ children, title }: { children: ReactNode; title: string }) {
  return (
    <section className="guide-group">
      <h2>{title}</h2>
      <HorizontalGuideRow ariaLabel={`${title} 공략`} className="guide-list-row">
        {children}
      </HorizontalGuideRow>
    </section>
  );
}

function SpecialLinkCard({ link }: { link: GuideSpecialLink }) {
  const className = "list-card special-link-card";
  const marker = link.external ? "외부 링크" : "바로가기";

  if (link.external) {
    return (
      <a className={className} href={link.href} target="_blank" rel="noopener noreferrer">
        <div className="cat">{marker}</div>
        <h3>{link.title}</h3>
        <p>{link.desc}</p>
      </a>
    );
  }

  return (
    <Link className={className} href={link.href}>
      <div className="cat">{marker}</div>
      <h3>{link.title}</h3>
      <p>{link.desc}</p>
    </Link>
  );
}
