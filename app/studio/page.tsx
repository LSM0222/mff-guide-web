import { redirect } from "next/navigation";

const studioUrl = process.env.SANITY_STUDIO_URL;

export default function Page() {
  if (studioUrl) {
    redirect(studioUrl);
  }

  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
      <h1>Studio URL이 아직 설정되지 않았습니다.</h1>
      <p>Cloudflare 환경 변수 SANITY_STUDIO_URL을 standalone Sanity Studio URL로 설정해주세요.</p>
    </main>
  );
}
