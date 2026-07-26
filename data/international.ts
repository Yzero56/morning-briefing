import { News } from "./news";

export const internationalNews: News[] = [
  {
    id: 101,
    category: "world",
    label: "국제",
    headline: "미국, 호르무즈 인근서 이란 공습 재개",
    body: "호르무즈 해협에서 상선이 피격당하자 미국이 이란 남부 거점을 겨냥해 공습을 감행했고, 이란은 맞대응으로 해협 봉쇄를 선언했어요. 긴장이 일주일째 이어지며 국제 유가도 배럴당 5달러 넘게 뛰었어요.",
    source: "경향신문, YTN",
    live: true,
    link: "/international",
  },
  {
    id: 102,
    category: "world",
    label: "국제",
    headline: "EU, 중국산 전기차 추가 관세안 이번 주 표결",
    body: "유럽연합이 중국산 전기차 추가 관세 부과 여부를 이번 주 최종 표결에 부칠 예정이에요. 프랑스·이탈리아는 찬성, 독일은 반대 입장이라 회원국 간 이견이 팽팽해요. 중국은 결과에 따라 맞대응 관세를 검토하겠다고 밝혔어요.",
    source: "블룸버그, 로이터",
    live: false,
    link: "/international",
  },
  {
    id: 103,
    category: "world",
    label: "국제",
    headline: "필리핀 민다나오서 규모 6.8 강진",
    body: "현지시간 새벽 필리핀 민다나오 섬 인근에서 규모 6.8 지진이 발생해 건물 붕괴와 정전 피해가 보고됐어요. 당국은 해안 지역에 쓰나미 주의보를 내렸다가 몇 시간 뒤 해제했고, 인명 피해는 아직 집계 중이에요.",
    source: "AFP, 필리핀 국가재난관리청",
    live: false,
    link: "/international",
  },
];