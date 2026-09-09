import Link from "next/link";
import type { Guide, HomeCard } from "@/content/types";
import { categoryLabel } from "@/content/utils";

export function HomeGuideCard({ card }: { card: HomeCard }) {
  return (
    <Link className="guide-card" href={card.route} data-coming={card.coming ? card.title : undefined}>
      {card.coming && <span className="coming-badge">준비중</span>}
      <div className="guide-card-icon">{card.icon || "◆"}</div>
      <h3>{card.title}</h3>
      <p>{card.desc || ""}</p>
    </Link>
  );
}

export function GuideListCard({ guide }: { guide: Guide }) {
  const coming = guide.status === "coming";
  return (
    <Link className="list-card" href={`/guides/${guide.slug}`} data-coming={coming ? guide.title : undefined}>
      {coming && <span className="status">준비중</span>}
      <div className="cat">{categoryLabel(guide.category)}</div>
      <h3>{guide.title}</h3>
      <p>{guide.description}</p>
    </Link>
  );
}
