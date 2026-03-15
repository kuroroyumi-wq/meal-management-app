import { NextResponse } from "next/server";
import { scrapeRecipe } from "@/lib/scraper";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const url = typeof body?.url === "string" ? body.url.trim() : "";

    if (!url) {
      return NextResponse.json(
        { error: "url を指定してください" },
        { status: 400 }
      );
    }

    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return NextResponse.json(
        { error: "http または https のURLを指定してください" },
        { status: 400 }
      );
    }

    const result = await scrapeRecipe(url);
    return NextResponse.json(result);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "スクレイピングに失敗しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
