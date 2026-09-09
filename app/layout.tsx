import type { Metadata } from "next";
import "./globals.css";
import "./v14-prototype.css";
import "./next-overrides.css";

export const metadata: Metadata = {
  title: "겁쟁이들의쉼터",
  description: "퓨처파이트 공략을 한 곳에서 빠르게 찾아보세요.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
