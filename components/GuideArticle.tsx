import type { Guide } from "@/content/types";
import { ArticleEnhancer } from "@/components/ArticleEnhancer";

function guideClass(slug: string) {
  return `guide-${slug.replace(/[^a-z0-9-]/gi, "-")}`;
}

export function GuideArticle({ guide, query, section }: { guide: Guide; query?: string; section?: string }) {
  const layoutClass = `${guide.slug === "damage-buff" ? "buff-layout " : ""}${guide.slug === "status-cleanse" ? "cleanse-layout " : ""}${guideClass(guide.slug)}`;

  return (
    <>
      <article className={`article ${layoutClass}`} id="articleRoot" dangerouslySetInnerHTML={{ __html: guide.html }} />
      <ArticleEnhancer query={query ?? ""} section={section ?? ""} />
    </>
  );
}
