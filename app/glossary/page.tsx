import { AppShell } from "@/components/AppShell";
import { GlossaryClient } from "@/components/GlossaryClient";
import { Topbar } from "@/components/Topbar";
import { glossary } from "@/content";

export default async function GlossaryPage({ searchParams }: PageProps<"/glossary">) {
  const params = await searchParams;
  const term = typeof params.term === "string" ? params.term : undefined;

  return (
    <AppShell>
      <Topbar current="퓨파 용어 사전" />
      <div className="content-wrap">
        <header className="page-head">
          <span className="eyebrow">GLOSSARY</span>
          <h1>퓨파 용어 사전</h1>
          <p>게임과 커뮤니티에서 자주 쓰는 줄임말, PVE·PVP·특수장비·영웅 관련 용어를 정리했습니다.</p>
        </header>
        <GlossaryClient entries={glossary} initialTerm={term} />
      </div>
    </AppShell>
  );
}
