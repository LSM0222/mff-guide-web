import Link from "next/link";
import { SearchForm } from "@/components/SearchForm";

export function Topbar({ current }: { current: string }) {
  return (
    <div className="topbar">
      <div className="breadcrumb">
        <Link href="/">홈</Link>
        <span>　›　</span>
        <strong>{current}</strong>
      </div>
      <SearchForm className="global-search" compact />
    </div>
  );
}
