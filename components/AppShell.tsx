import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { ClientChrome } from "@/components/ClientChrome";
import { guideCategories } from "@/content/guide-taxonomy";

const navItems = [
  { key: "home", href: "/", icon: "⌂", label: "홈" },
  ...guideCategories.map((category) => ({
    key: category.id,
    href: `/guides?category=${category.id}`,
    icon: category.icon,
    label: category.label,
  })),
];

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <>
      <Suspense fallback={null}>
        <ClientChrome />
      </Suspense>
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
      </aside>
      <div className="app" id="top">
        {children}
      </div>
    </>
  );
}
