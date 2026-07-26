import Link from "next/link";
import { News } from "@/data/news";

export default function NewsCard({ news, index }: { news: News; index: number }) {
  // 외부 뉴스 링크 
  const isExternal = /^https?:\/\//.test(news.link);

  // 카드 그림 내용 
  const inner = (
    <>
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
    </>
  );

  // 날씨 카드는 클릭해도 상세페이지로 넘어가지 않도록 설정
  if (news.category === "weather") {
    return (
      <div className="item" data-cat={news.category}>
        {inner}
      </div>
    );
  }

  return (
    <Link
      href={news.link}
      className="item"
      data-cat={news.category}
      {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {inner}
    </Link>
  );
}