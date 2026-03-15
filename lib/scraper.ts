import axios from "axios";
import * as cheerio from "cheerio";

export interface ScrapedIngredient {
  name: string;
  amount: string;
  unit: string;
}

export interface ScrapedRecipe {
  title: string;
  ingredients: ScrapedIngredient[];
  source_url: string;
}

const DEFAULT_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
  "Accept-Language": "ja,en;q=0.9",
};

/** 材料1行を name / amount / unit に分離（例: "にんじん 50g" → name: "にんじん", amount: "50", unit: "g"） */
function parseIngredientLine(text: string): ScrapedIngredient {
  const t = text.trim().replace(/\s+/g, " ");
  const endMatch = t.match(/\s+([\d.,／/・]+)\s*([^\d\s][^\s]*)?\s*$/);
  if (endMatch) {
    const name = t.slice(0, endMatch.index).trim();
    const amount = endMatch[1].trim();
    const unit = (endMatch[2] || "").trim() || "—";
    return { name: name || t, amount, unit };
  }
  const startMatch = t.match(/^([\d.,／/・]+)\s*(\S*)\s+(.+)$/);
  if (startMatch) {
    return {
      name: startMatch[3].trim(),
      amount: startMatch[1].trim(),
      unit: (startMatch[2] || "").trim() || "—",
    };
  }
  return { name: t, amount: "—", unit: "—" };
}

/** JSON-LD の Recipe から材料を取得 */
function fromJsonLd($: cheerio.CheerioAPI): ScrapedIngredient[] | null {
  const scripts = $('script[type="application/ld+json"]');
  for (let i = 0; i < scripts.length; i++) {
    try {
      const raw = $(scripts[i]).html()?.trim();
      if (!raw) continue;
      const data = JSON.parse(raw);
      const recipe = Array.isArray(data) ? data.find((d: { "@type"?: string }) => d["@type"] === "Recipe") : data;
      if (!recipe || recipe["@type"] !== "Recipe") continue;
      const list = recipe.recipeIngredient;
      if (!Array.isArray(list)) continue;
      return list.map((item: string) => parseIngredientLine(String(item)));
    } catch {
      continue;
    }
  }
  return null;
}

/** テキストから「材料」セクションを探してリストをパース */
function fromMaterialSection($: cheerio.CheerioAPI): ScrapedIngredient[] | null {
  const body = $("body").text();
  if (!body.includes("材料") && !body.includes("食材")) return null;

  const selectors = [
    '[class*="ingredient"]',
    '[class*="material"]',
    '[class*="recipe-ingredient"]',
    '[class*="zairyo"]',
    ".ingredients li",
    ".recipe-ingredients li",
    "ul.ingredient-list li",
    "table.ingredients tr",
    ".wprm-recipe-ingredient",
  ];

  for (const sel of selectors) {
    const els = $(sel);
    if (els.length < 2) continue;
    const items: ScrapedIngredient[] = [];
    els.each((_, el) => {
      const text = $(el).text().trim().replace(/\s+/g, " ");
      if (!text || text.length > 200) return;
      items.push(parseIngredientLine(text));
    });
    if (items.length >= 1) return items;
  }

  return null;
}

/** 汎用: リストっぽい要素を材料として取得 */
function fromGenericList($: cheerio.CheerioAPI): ScrapedIngredient[] | null {
  const candidates = $("ul li, ol li, .ingredient, [class*='ingredient']");
  if (candidates.length < 2) return null;
  const items: ScrapedIngredient[] = [];
  candidates.each((_, el) => {
    const text = $(el).text().trim().replace(/\s+/g, " ");
    if (!text || text.length > 150) return;
    items.push(parseIngredientLine(text));
  });
  return items.length >= 1 ? items : null;
}

export async function scrapeRecipe(url: string): Promise<ScrapedRecipe> {
  const res = await axios.get<string>(url, {
    timeout: 15000,
    maxRedirects: 5,
    headers: DEFAULT_HEADERS,
    responseType: "text",
    validateStatus: (status) => status === 200,
  });

  const html = res.data;
  const $ = cheerio.load(html);

  let title =
    $('meta[property="og:title"]').attr("content")?.trim() ||
    $("h1").first().text().trim() ||
    $("title").text().trim() ||
    "";

  let ingredients: ScrapedIngredient[] | null =
    fromJsonLd($) ?? fromMaterialSection($) ?? fromGenericList($);

  if (!ingredients || ingredients.length === 0) {
    ingredients = [];
  }

  return {
    title: title || "（タイトルなし）",
    ingredients,
    source_url: url,
  };
}
