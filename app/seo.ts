import type { Metadata } from "next";

export const SITE_TITLE = "겁쟁이들의쉼터 - [MFF 공략]";
export const SITE_DESCRIPTION = "겁쟁이들의쉼터 연합에서 제공하는 마블 퓨처파이트 공략 사이트입니다.";

export function getSiteUrl() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!siteUrl) return null;

  try {
    return new URL(siteUrl);
  } catch {
    return null;
  }
}

export function createCanonicalUrl(pathname: string) {
  const siteUrl = getSiteUrl();
  if (!siteUrl) return null;

  return new URL(pathname, siteUrl).toString();
}

export function createRouteMetadata(pathname: string): Metadata {
  const canonical = createCanonicalUrl(pathname);

  return {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    alternates: canonical ? { canonical } : undefined,
    openGraph: {
      title: SITE_TITLE,
      description: SITE_DESCRIPTION,
      type: "website",
      url: canonical ?? undefined,
    },
    twitter: {
      card: "summary",
      title: SITE_TITLE,
      description: SITE_DESCRIPTION,
    },
  };
}

export const defaultSeoMetadata: Metadata = {
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  metadataBase: getSiteUrl() ?? undefined,
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    type: "website",
  },
  twitter: {
    card: "summary",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
};
