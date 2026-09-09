import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { HomeGuideCard } from "@/components/GuideCards";
import { SearchForm } from "@/components/SearchForm";
import { getSiteSettings, homeSections } from "@/sanity/lib/content";
import { createRouteMetadata } from "./seo";

export const metadata = createRouteMetadata("/");

export default async function Home() {
  const settings = await getSiteSettings();

  return (
    <AppShell>
      <div className="page-shell">
        <div className="home-grid">
          <main>
            <section className="hero">
              <div className="hero-kicker">FUTURE FIGHT COMMUNITY GUIDE</div>
              <h1>겁쟁이들의쉼터</h1>
              <p>퓨처파이트 공략을 한 곳에서 빠르게 찾아보세요.</p>
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
              <div className="chips">
                <Link className="chip active" href="/guides">
                  전체
                </Link>
                <Link className="chip" href="/guides?category=beginner">
                  뉴비 시작
                </Link>
                <Link className="chip" href="/guides?category=growth">
                  성장 · 세팅
                </Link>
                <Link className="chip" href="/guides?category=content">
                  콘텐츠
                </Link>
                <Link className="chip" href="/guides?category=tips">
                  정보 · 팁
                </Link>
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
                <div className="card-grid">
                  {section.cards.map((card) => (
                    <HomeGuideCard card={card} key={card.title} />
                  ))}
                </div>
              </section>
            ))}
            <Link className="glossary-banner" href="/glossary">
              <div>
                <strong>퓨파 용어 사전</strong>
                <p>차틈, 버스, 태생캐, 주자 같은 용어를 빠르게 확인해보세요.</p>
              </div>
              <span className="go">바로가기 →</span>
            </Link>
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
            <section className="rail-card">
              <div className="rail-title">인기 공략 TOP 5</div>
              {settings.popularGuides.map((guide, index) => (
                <Link className="popular-row" href={`/guides/${guide.slug}`} key={guide.slug}>
                  <span className="popular-num">{index + 1}</span>
                  <span>{guide.title}</span>
                </Link>
              ))}
            </section>
            <section className="rail-card ad-rail-card" aria-label="광고 영역">
              <div className="ad-label">광고</div>
              <div className="adsense-placeholder">
                <strong>AdSense 광고 영역</strong>
                <span>실제 광고 코드는 배포 단계에서 연결</span>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
