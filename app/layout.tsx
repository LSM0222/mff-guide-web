import type { Metadata } from "next";
import { defaultSeoMetadata } from "./seo";
import "./globals.css";
import "./v14-prototype.css";
import "./next-overrides.css";

export const metadata: Metadata = defaultSeoMetadata;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
