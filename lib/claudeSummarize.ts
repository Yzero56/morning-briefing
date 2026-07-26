// lib/claudeSummarize.ts
import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error(
        "ANTHROPIC_API_KEY가 설정되지 않았습니다. .env.local을 확인해주세요."
      );
    }
    client = new Anthropic({ apiKey, timeout: 8000 });
  }
  return client;
}

export type ArticleInput = { headline: string; body: string };
export type ArticleSummary = { headline: string; summary: string };

// 여러 기사를 한 번의 API 호출로 묶어서 제목·본문을 함께 다시 씀 (호출 횟수 = 비용을 최소화)
export async function summarizeArticlesWithAI(
  articles: ArticleInput[]
): Promise<ArticleSummary[]> {
  const anthropic = getClient();

  const articlesText = articles
    .map((a, i) => `${i + 1}. 원제목: ${a.headline}\n내용: ${a.body}`)
    .join("\n\n");

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 1024,
    output_config: {
      format: {
        type: "json_schema",
        schema: {
          type: "object",
          properties: {
            articles: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  headline: { type: "string" },
                  summary: { type: "string" },
                },
                required: ["headline", "summary"],
                additionalProperties: false,
              },
            },
          },
          required: ["articles"],
          additionalProperties: false,
        },
      },
    },
    messages: [
      {
        role: "user",
        content:
          `다음 국제 뉴스 ${articles.length}개 각각에 대해 headline과 summary를 만들어줘.\n\n` +
          `- headline: 원제목이 "...", "[뉴스UP]" 같은 태그나 말줄임표로 잘려 있으면 자연스러운 완성된 한 문장 제목으로 다시 써줘. 이미 깔끔하면 그대로 둬도 돼. 간결한 뉴스 헤드라인 톤(단정형, "~다") 유지.\n` +
          `- summary: 2문장, 친근한 "~해요" 말투로 핵심(누가·무엇을·왜 중요한지)만 담아 직접 이해하고 새로 표현 (원문 문장을 그대로 베끼지 말 것).\n\n` +
          `articles 배열은 기사 순서와 동일해야 해.\n\n${articlesText}`,
      },
    ],
  });

  const textBlock = response.content.find(
    (block): block is Anthropic.TextBlock => block.type === "text"
  );
  if (!textBlock) {
    throw new Error("AI 요약 응답에서 텍스트 블록을 찾을 수 없습니다.");
  }

  const parsed = JSON.parse(textBlock.text) as { articles: ArticleSummary[] };
  if (!Array.isArray(parsed.articles) || parsed.articles.length !== articles.length) {
    throw new Error("AI 응답 개수가 기사 개수와 일치하지 않습니다.");
  }
  return parsed.articles;
}
