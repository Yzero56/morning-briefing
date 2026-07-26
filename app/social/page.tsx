import NewsCard from "@/components/NewsCard";
import { getSocialNews } from "@/data/social";


export default async function SocialPage() {


  const socialNews = await getSocialNews();


  return (

    <div className="board">

      <header>

        <div>
          <h1>
            사회 뉴스
          </h1>
        </div>


        <div className="count">

          대표 뉴스

          <b>
            01
          </b>

        </div>

      </header>


      <p className="sub">
        언론사 우선순위를 반영한 오늘의 대표 사회 뉴스입니다.
      </p>


      {socialNews.map((news, i) => (

        <NewsCard
          key={news.id}
          news={news}
          index={i + 1}
        />

      ))}


    </div>

  );
}