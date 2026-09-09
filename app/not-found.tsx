import Link from "next/link";
import { AppShell } from "@/components/AppShell";

export default function NotFound() {
  return (
    <AppShell>
      <div className="content-wrap">
        <header className="page-head">
          <span className="eyebrow">404</span>
          <h1>페이지를 찾을 수 없습니다</h1>
          <p>주소가 바뀌었거나 더 이상 제공되지 않는 페이지입니다.</p>
        </header>
        <Link className="chip active" href="/">
          HOME
        </Link>
      </div>
    </AppShell>
  );
}
