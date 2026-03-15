import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { canMakeFromInventory } from "@/lib/inventory-recipes";
import { generateLeftoverPatterns } from "@/lib/claude";

/**
 * 余り食材で作れるレシピを使って、10パターンの1週間献立をAI生成
 */
export async function POST() {
  try {
    const supabase = await createClient();

    const [invRes, recipesRes, ingredientsRes] = await Promise.all([
      supabase
        .from("inventory")
        .select("ingredient_id, quantity")
        .gt("quantity", 0),
      supabase.from("recipes").select("id, name").order("name"),
      supabase.from("ingredients").select("id, name, unit"),
    ]);

    if (invRes.error || recipesRes.error || ingredientsRes.error) {
      return NextResponse.json(
        { error: "データの取得に失敗しました" },
        { status: 500 }
      );
    }

    const ingList = (ingredientsRes.data ?? []) as {
      id: string;
      name: string;
      unit?: string;
    }[];
    const unitMap = new Map(ingList.map((i) => [i.id, i.unit ?? "g"]));
    const invData = invRes.data ?? [];
    const inventoryMap = new Map<
      string,
      { quantity: number; unit: string }
    >();
    for (const row of invData) {
      inventoryMap.set(row.ingredient_id, {
        quantity: row.quantity,
        unit: unitMap.get(row.ingredient_id) ?? "g",
      });
    }

    const recipeIds = (recipesRes.data ?? []).map((r) => r.id);
    if (recipeIds.length === 0) {
      return NextResponse.json(
        { error: "レシピが登録されていません" },
        { status: 400 }
      );
    }

    const { data: riRows } = await supabase
      .from("recipe_ingredients")
      .select("recipe_id, ingredient_id, amount, unit")
      .in("recipe_id", recipeIds);

    const riByRecipe = new Map<
      string,
      { ingredient_id: string; amount: number; unit: string }[]
    >();
    for (const ri of riRows ?? []) {
      const list = riByRecipe.get(ri.recipe_id) ?? [];
      list.push({
        ingredient_id: ri.ingredient_id,
        amount: Number(ri.amount),
        unit: ri.unit,
      });
      riByRecipe.set(ri.recipe_id, list);
    }

    const suggested = (recipesRes.data ?? []).filter((r) =>
      canMakeFromInventory(riByRecipe.get(r.id) ?? [], inventoryMap)
    );
    const recipeNames = suggested.map((r) => r.name);
    const ingredientNames = ingList.map((i) => i.name);

    if (recipeNames.length === 0) {
      return NextResponse.json(
        { error: "在庫から作れるレシピがありません" },
        { status: 400 }
      );
    }

    const patterns = await generateLeftoverPatterns(
      recipeNames,
      ingredientNames
    );

    return NextResponse.json({ patterns });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "10パターンの生成に失敗しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
