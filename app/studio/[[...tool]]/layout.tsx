import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function StudioLayout({ children }: LayoutProps<"/studio/[[...tool]]">) {
  return children;
}
