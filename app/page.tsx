import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { HomeGuideCard } from "@/components/GuideCards";
import { HorizontalGuideRow } from "@/components/HorizontalGuideRow";
import { SearchForm } from "@/components/SearchForm";
import { homeSectionsFromTaxonomy } from "@/content/guide-taxonomy";
import { getGuides, getSiteSettings } from "@/sanity/lib/content";
import { createRouteMetadata } from "./seo";

export const metadata = createRouteMetadata("/");

export default async function Home() {
  const [settings, guides] = await Promise.all([getSiteSettings(), getGuides()]);
  const homeSections = homeSectionsFromTaxonomy(guides);

  return (
    <AppShell>
      <div className="page-shell">
        <div className="home-grid">
          <main>
            <section className="hero">
              <div className="hero-kicker">FUTURE FIGHT COMMUNITY GUIDE</div>
              <h1>겁쟁이들의쉼터</h1>
              <p>마블 퓨처파이트 공략을 한 곳에서 빠르게 찾아보세요.</p>
              <SearchForm />
              <div className="hero-useful-links">
                <span className="hero-useful-label">유용한 링크</span>
                {settings.usefulLinks.map((link) => (
                  <a key={link.label} className="link-row" href={link.url} target="_blank" rel="noopener noreferrer">
                    <span>{link.label}</span>
                    <span>↗</span>
                  </a>
                ))}
              </div>
            </section>
            {homeSections.map((section) => (
              <section className="home-section" key={section.category}>
                <div className="section-title-row">
                  <h2>{section.title}</h2>
                  <Link className="section-more" href={`/guides?category=${section.category}`}>
                    ›
                  </Link>
                </div>
                <HorizontalGuideRow ariaLabel={`${section.title} 공략`}>
                  {section.cards.map((card) => (
                    <HomeGuideCard card={card} key={card.title} />
                  ))}
                </HorizontalGuideRow>
              </section>
            ))}
            <section className="ad-placeholder ad-placeholder-horizontal home-bottom-ad" aria-label="광고 영역">
              <span className="ad-label">광고</span>
              <div className="ad-placeholder-body">
                <strong>광고 영역</strong>
                <span>콘텐츠 하단 가로형 슬롯</span>
              </div>
            </section>
          </main>
          <aside className="right-rail">
            <section className="rail-card">
              <div className="rail-title">
                공략 업데이트 <small>GUIDE</small>
              </div>
              {settings.updates.map((update) => (
                <Link className="update-row" href={update.route} key={`${update.date}-${update.title}`}>
                  <span className="update-date">{update.date}</span>
                  <span className="tag">{update.tag}</span>
                  <span>{update.title}</span>
                </Link>
              ))}
            </section>
            <section className="rail-card ad-rail-card" aria-label="광고 영역">
              <span className="ad-label">광고</span>
              <div className="ad-placeholder-body">
                <strong>광고 영역</strong>
                <span>사이드바 슬롯</span>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
