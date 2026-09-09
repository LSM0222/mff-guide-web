import Link from "next/link";
import type { ReactNode } from "react";
import { categoryMeta } from "@/content";
import { ClientChrome } from "@/components/ClientChrome";

const navItems = [
  { key: "home", href: "/", icon: "⌂", label: "홈" },
  { key: "guides", href: "/guides", icon: "▣", label: "전체 공략" },
  { key: "beginner", href: "/guides?category=beginner", icon: "◎", label: categoryMeta.beginner.label },
  { key: "growth", href: "/guides?category=growth", icon: "↗", label: categoryMeta.growth.label },
  { key: "content", href: "/guides?category=content", icon: "▤", label: categoryMeta.content.label },
  { key: "tips", href: "/guides?category=tips", icon: "✦", label: categoryMeta.tips.label },
  { key: "glossary", href: "/glossary", icon: "▤", label: "퓨파 용어 사전" },
];

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <>
      <ClientChrome />
      <aside className="sidebar" id="sidebar">
        <Link className="brand" href="/">
          겁쟁이들의<span>쉼터</span>
        </Link>
        <nav className="nav" aria-label="주요 메뉴">
          {navItems.map((item) => (
            <Link key={item.key} data-nav={item.key} href={item.href}>
              <span className="ico">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="nav-divider" />
        <Link className="patch-card" href="/guides/alliance-battle">
          <div className="patch-title">최근 업데이트</div>
          <div className="patch-name">극레얼 주자/버퍼 정리</div>
          <div className="patch-note">2026.08.28</div>
          <div className="patch-arrow">바로가기 →</div>
        </Link>
      </aside>
      <div className="app" id="top">
        {children}
      </div>
    </>
  );
}
