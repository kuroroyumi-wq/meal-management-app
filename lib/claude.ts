import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-sonnet-4-20250514";

export interface GenerateMenuParams {
  weekStart: string;
  headcount: number;
  budgetPerDay?: number;
  recipeNames: string[];
  ingredientNames: string[];
  recentMenuSummary?: string;
}

export interface GeneratedDay {
  breakfast: string;
  lunch: string;
  dinner: string;
}

export interface GeneratedMenuJson {
  monday?: GeneratedDay;
  tuesday?: GeneratedDay;
  wednesday?: GeneratedDay;
  thursday?: GeneratedDay;
  friday?: GeneratedDay;
  saturday?: GeneratedDay;
  sunday?: GeneratedDay;
}

function buildPrompt(params: GenerateMenuParams): string {
  const {
    weekStart,
    headcount,
    budgetPerDay,
    recipeNames,
    ingredientNames,
    recentMenuSummary,
  } = params;

  const recipeList =
    recipeNames.length > 0
      ? recipeNames.join("、")
      : "（登録レシピがありません。一般的な献立名で答えてください）";
  const ingredientList =
    ingredientNames.length > 0
      ? ingredientNames.slice(0, 80).join("、")
      : "特になし";
  const budgetText =
    budgetPerDay != null && budgetPerDay > 0
      ? `予算目安: 1日あたり ${budgetPerDay} 円`
      : "予算は問いません";
  const recentText = recentMenuSummary
    ? `直近の献立（重ならないようにすること）:\n${recentMenuSummary}`
    : "";

  return `あなたは高齢者施設の献立担当です。以下の条件で1週間（月〜日）の献立を提案してください。

【条件】
- 週の開始日: ${weekStart}
- 人数: ${headcount}名
- ${budgetText}
- 栄養バランスを考慮し、高齢者向けの消化しやすいメニューにすること

【使えるレシピ名（この中から選ぶこと）】
${recipeList}

【利用可能な食材の例】
${ingredientList}
${recentText ? "\n" + recentText : ""}

【出力形式】
以下のJSON形式のみを返してください。説明文は不要です。朝食・昼食・夕食には、上記のレシピ名から選んだ名前を1つずつ入れてください。該当するレシピがなければ一般的な献立名（例: ごはん、味噌汁、焼き魚定食）で構いません。

{
  "monday": { "breakfast": "レシピ名", "lunch": "レシピ名", "dinner": "レシピ名" },
  "tuesday": { "breakfast": "レシピ名", "lunch": "レシピ名", "dinner": "レシピ名" },
  "wednesday": { "breakfast": "レシピ名", "lunch": "レシピ名", "dinner": "レシピ名" },
  "thursday": { "breakfast": "レシピ名", "lunch": "レシピ名", "dinner": "レシピ名" },
  "friday": { "breakfast": "レシピ名", "lunch": "レシピ名", "dinner": "レシピ名" },
  "saturday": { "breakfast": "レシピ名", "lunch": "レシピ名", "dinner": "レシピ名" },
  "sunday": { "breakfast": "レシピ名", "lunch": "レシピ名", "dinner": "レシピ名" }
}`;
}

function extractJsonFromText(text: string): string {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return "";
  return text.slice(start, end + 1);
}

export async function generateWeeklyMenu(
  params: GenerateMenuParams
): Promise<GeneratedMenuJson> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY が設定されていません");
  }

  const anthropic = new Anthropic({ apiKey });
  const prompt = buildPrompt(params);

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 2048,
    messages: [{ role: "user", content: prompt }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  const raw =
    textBlock && "text" in textBlock ? String(textBlock.text) : "";
  const jsonStr = extractJsonFromText(raw);
  if (!jsonStr) {
    throw new Error("AIの応答からJSONを取得できませんでした");
  }

  const parsed = JSON.parse(jsonStr) as GeneratedMenuJson;
  return parsed;
}
