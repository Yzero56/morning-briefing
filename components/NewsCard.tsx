// components/NewsCard.tsx
import Link from "next/link";
import { News } from "@/data/news";
import Thumb from "./Thumb";

export default function NewsCard({ news, index }: { news: News; index: number }) {
  const isExternal = /^https?:\/\//.test(news.link);

  return (
    <Link
      href={news.link}
      className="item"
      data-cat={news.category}
      {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      <div className="idx">{String(index).padStart(2, "0")}</div>
      <div className="item-body">
        <div className="item-text">
          <div className="tag-row">
            <span className="tag">{news.label}</span>
            {news.live && <span className="live">진행중</span>}
          </div>
          <h2>{news.headline}</h2>
          <p>{news.body}</p>
          <div className="meta">SOURCE: {news.source}</div>
        </div>
        {news.image && <Thumb src={news.image} alt={news.headline} />}
      </div>
    </Link>
  );
}