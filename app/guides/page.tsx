import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { GuideListCard } from "@/components/GuideCards";
import { Topbar } from "@/components/Topbar";
import { categoryDescription, categoryLabel } from "@/content/utils";
import { categoryMeta, getGuides } from "@/sanity/lib/content";
import { createRouteMetadata } from "../seo";

export const metadata = createRouteMetadata("/guides");

export default async function GuidesPage({ searchParams }: PageProps<"/guides">) {
  const params = await searchParams;
  const category = typeof params.category === "string" ? params.category : undefined;
  const guides = await getGuides();
  const items = category ? guides.filter((guide) => guide.category === category) : guides;
  const title = category ? categoryLabel(category) : "전체 공략";

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
            {Object.entries(categoryMeta).map(([key, meta]) => (
              <Link key={key} className={`chip ${category === key ? "active" : ""}`} href={`/guides?category=${key}`}>
                {meta.label}
              </Link>
            ))}
          </div>
          <span className="source-note">{items.length}개 항목</span>
        </div>
        <div className="guide-list-grid">
          {items.map((guide) => (
            <GuideListCard guide={guide} key={guide.slug} />
          ))}
        </div>
      </div>
    </AppShell>
  );
}
