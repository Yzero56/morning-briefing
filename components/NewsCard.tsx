// components/NewsCard.tsx
import Link from "next/link";
import { News } from "@/data/news";

export default function NewsCard({ news, index }: { news: News; index: number }) {
  return (
    <Link href={news.link} className="item" data-cat={news.category}>
      <div className="idx">{String(index).padStart(2, "0")}</div>
      <div className="item-body">
        <div className="tag-row">
          <span className="tag">{news.label}</span>
          {news.live && <span className="live">진행중</span>}
        </div>
        <h2>{news.headline}</h2>
        <p>{news.body}</p>
        <div className="meta">SOURCE: {news.source}</div>
      </div>
    </Link>
  );
}