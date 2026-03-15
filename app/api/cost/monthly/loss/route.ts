import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * 月次食材ロス集計
 * 食材ロス = 仕入れ量 - 使用量（ingredient_id ごと）
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json(
        { error: "month は YYYY-MM 形式で指定してください" },
        { status: 400 }
      );
    }
    const start = `${month}-01`;
    const end = `${month}-31`;

    const supabase = await createClient();

    const [purchasesRes, usageRes, ingredientsRes] = await Promise.all([
      supabase
        .from("purchases")
        .select("ingredient_id, quantity")
        .gte("purchased_at", start)
        .lte("purchased_at", end),
      supabase
        .from("inventory_usage")
        .select("ingredient_id, quantity_used")
        .gte("used_at", start)
        .lte("used_at", end),
      supabase.from("ingredients").select("id, name"),
    ]);

    if (purchasesRes.error || usageRes.error || ingredientsRes.error) {
      return NextResponse.json(
        { error: "データの取得に失敗しました" },
        { status: 500 }
      );
    }

    const nameMap = new Map(
      (ingredientsRes.data ?? []).map((i) => [i.id, i.name])
    );

    const purchasedByIng = new Map<string, number>();
    for (const r of purchasesRes.data ?? []) {
      if (!r.ingredient_id) continue;
      const q = Number(r.quantity);
      purchasedByIng.set(
        r.ingredient_id,
        (purchasedByIng.get(r.ingredient_id) ?? 0) + q
      );
    }

    const usedByIng = new Map<string, number>();
    for (const r of usageRes.data ?? []) {
      if (!r.ingredient_id) continue;
      const q = Number(r.quantity_used);
      usedByIng.set(
        r.ingredient_id,
        (usedByIng.get(r.ingredient_id) ?? 0) + q
      );
    }

    const ingredientIds = new Set([
      ...purchasedByIng.keys(),
      ...usedByIng.keys(),
    ]);
    const byIngredient: {
      ingredient_id: string;
      name: string;
      purchased: number;
      used: number;
      loss: number;
    }[] = [];

    let totalPurchased = 0;
    let totalUsed = 0;
    for (const id of ingredientIds) {
      const purchased = purchasedByIng.get(id) ?? 0;
      const used = usedByIng.get(id) ?? 0;
      const loss = Math.max(0, purchased - used);
      totalPurchased += purchased;
      totalUsed += used;
      byIngredient.push({
        ingredient_id: id,
        name: nameMap.get(id) ?? "不明",
        purchased,
        used,
        loss,
      });
    }

    const totalLoss = totalPurchased - totalUsed;
    const lossRatePercent =
      totalPurchased > 0
        ? Math.round((Math.max(0, totalLoss) / totalPurchased) * 1000) / 10
        : 0;

    const top5 = [...byIngredient]
      .filter((x) => x.loss > 0)
      .sort((a, b) => b.loss - a.loss)
      .slice(0, 5);

    return NextResponse.json({
      month,
      total_purchased: totalPurchased,
      total_used: totalUsed,
      total_loss: Math.max(0, totalLoss),
      loss_rate_percent: lossRatePercent,
      by_ingredient: byIngredient,
      top5_loss_ingredients: top5,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
