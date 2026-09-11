import type { Guide, HomeCard } from "@/content/types";

export type GuideCategoryId =
  | "getting-started"
  | "beginner-content"
  | "inventory-items"
  | "gameplay-tips"
  | "advanced-content"
  | "account-growth"
  | "hero-buffs"
  | "spending";

export type GuideSpecialLink = {
  title: string;
  desc: string;
  href: string;
  external?: boolean;
};

export type GuideSubcategory = {
  id: string;
  label: string;
  guideSlugs: string[];
  specialLinks?: GuideSpecialLink[];
};

export type GuideCategoryConfig = {
  id: GuideCategoryId;
  label: string;
  desc: string;
  icon: string;
  guideSlugs: string[];
  specialLinks?: GuideSpecialLink[];
  subcategories?: GuideSubcategory[];
};

export const guideCategories: GuideCategoryConfig[] = [
  {
    id: "getting-started",
    label: "처음 시작한다면",
    desc: "계정 연동, 설정, 연합 가입처럼 시작 직후 먼저 챙길 항목입니다.",
    icon: "◎",
    guideSlugs: ["account", "content-guide"],
    specialLinks: [
      {
        title: "퓨파 용어사전으로 이동",
        desc: "차틈, 버스, 주자처럼 자주 쓰는 용어를 확인합니다.",
        href: "/glossary",
      },
    ],
  },
  {
    id: "beginner-content",
    label: "초보용",
    desc: "신규/복귀 숙제, 초반 콘텐츠, 월드 보스와 조합 추천입니다.",
    icon: "▤",
    guideSlugs: ["content-guide", "legend-world-boss"],
  },
  {
    id: "inventory-items",
    label: "인벤토리 및 아이템 수급처 공략",
    desc: "인벤토리 정리, 초반 보존 아이템, 에너지와 승급 재료 수급처입니다.",
    icon: "□",
    guideSlugs: ["inventory", "content-guide", "promotion-materials"],
    subcategories: [
      {
        id: "biometric-selectors",
        label: "생체 데이터 선택",
        guideSlugs: ["hero-selection"],
      },
    ],
  },
  {
    id: "gameplay-tips",
    label: "게임이 편해지는 팁",
    desc: "현황판, T4 스킬, 덱 슬롯, 잠재력 강화와 자잘한 편의 팁입니다.",
    icon: "✦",
    guideSlugs: ["content-guide", "tips"],
  },
  {
    id: "advanced-content",
    label: "숙련자용",
    desc: "섀도우랜드, 극레얼, 아더월드 등 숙련자용 콘텐츠 공략입니다.",
    icon: "△",
    guideSlugs: ["shadowland", "alliance-battle", "otherworld"],
    specialLinks: [
      {
        title: "얼배웹",
        desc: "현재 사이트에서 쓰던 외부 얼라이언스 배틀 자료 링크입니다.",
        href: "https://mff-guide.vercel.app/",
        external: true,
      },
    ],
    subcategories: [
      {
        id: "event-content",
        label: "이벤트 콘텐츠 관련",
        guideSlugs: ["events"],
      },
    ],
  },
  {
    id: "account-growth",
    label: "스펙업 / 계정 성장 / 시즌 유니폼",
    desc: "스펙업 로드맵, 카드, 소드, 자비스, 특장, 시즌 유니폼, 아티팩트입니다.",
    icon: "↗",
    guideSlugs: ["specup", "comic-card", "x-of-sword", "jarvis", "ctp", "season-uniform", "artifact"],
  },
  {
    id: "hero-buffs",
    label: "각종 버프 영웅 정리",
    desc: "PVE 피해량 증감 버프와 PVP 상태이상 제거 버프 정리입니다.",
    icon: "↑",
    guideSlugs: ["damage-buff", "status-cleanse"],
  },
  {
    id: "spending",
    label: "과금 관련",
    desc: "과금 추천과 관련 안내입니다.",
    icon: "◉",
    guideSlugs: ["spending"],
  },
];

export const guideCategoryMeta = Object.fromEntries(
  guideCategories.map((category) => [category.id, { label: category.label, desc: category.desc }]),
);

export const primaryGuideCategoryBySlug = new Map<string, GuideCategoryConfig>();

for (const category of guideCategories) {
  for (const slug of allCategoryGuideSlugs(category)) {
    if (!primaryGuideCategoryBySlug.has(slug)) {
      primaryGuideCategoryBySlug.set(slug, category);
    }
  }
}

export function getGuideCategory(categoryId?: string) {
  return guideCategories.find((category) => category.id === categoryId);
}

export function guideCategoryLabel(categoryId?: string) {
  return getGuideCategory(categoryId)?.label ?? "공략";
}

export function guideCategoryDescription(categoryId?: string) {
  return getGuideCategory(categoryId)?.desc ?? "현재 사이트에서 제공하는 공략을 한 곳에서 확인할 수 있습니다.";
}

export function primaryGuideCategory(guide: Guide) {
  return primaryGuideCategoryBySlug.get(guide.slug);
}

export function primaryGuideCategoryLabel(guide: Guide) {
  return primaryGuideCategory(guide)?.label ?? guideCategoryLabel(guide.category);
}

export function categoryContainsGuide(category: GuideCategoryConfig, guideSlug: string) {
  return allCategoryGuideSlugs(category).includes(guideSlug);
}

export function guidesForSlugs(guides: Guide[], slugs: string[]) {
  const guideMap = new Map(guides.map((guide) => [guide.slug, guide]));
  return slugs.map((slug) => guideMap.get(slug)).filter((guide): guide is Guide => Boolean(guide));
}

export function allCategoryGuideSlugs(category: GuideCategoryConfig) {
  return [...category.guideSlugs, ...(category.subcategories ?? []).flatMap((subcategory) => subcategory.guideSlugs)];
}

export function homeSectionsFromTaxonomy(guides: Guide[]) {
  return guideCategories.map((category) => ({
    title: category.label,
    category: category.id,
    cards: [
      ...guidesForSlugs(guides, allCategoryGuideSlugs(category)).map(guideToHomeCard),
      ...(category.specialLinks ?? []).map(specialLinkToHomeCard),
      ...(category.subcategories ?? []).flatMap((subcategory) => (subcategory.specialLinks ?? []).map(specialLinkToHomeCard)),
    ],
  }));
}

function guideToHomeCard(guide: Guide): HomeCard {
  return {
    title: guide.title,
    desc: guide.description,
    icon: primaryGuideCategory(guide)?.icon ?? "◆",
    route: `/guides/${guide.slug}`,
    coming: guide.status === "coming",
  };
}

function specialLinkToHomeCard(link: GuideSpecialLink): HomeCard {
  return {
    title: link.title,
    desc: link.desc,
    icon: link.external ? "↗" : "▤",
    route: link.href,
  };
}
