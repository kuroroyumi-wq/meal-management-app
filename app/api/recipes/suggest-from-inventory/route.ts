import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { canMakeFromInventory } from "@/lib/inventory-recipes";

/**
 * 現在の在庫から作れるレシピ一覧を返す
 */
export async function GET() {
  try {
    const supabase = await createClient();

    const [invRes, recipesRes] = await Promise.all([
      supabase.from("inventory").select("ingredient_id, quantity").gt("quantity", 0),
      supabase.from("recipes").select("id, name, servings").order("name"),
    ]);

    if (invRes.error) {
      return NextResponse.json({ error: invRes.error.message }, { status: 500 });
    }
    if (recipesRes.error) {
      return NextResponse.json({ error: recipesRes.error.message }, { status: 500 });
    }

    const ingredients = await supabase
      .from("ingredients")
      .select("id, unit")
      .in("id", [...new Set((invRes.data ?? []).map((r) => r.ingredient_id))]);
    const unitMap = new Map((ingredients.data ?? []).map((i) => [i.id, i.unit]));

    const inventoryMap = new Map<string, { quantity: number; unit: string }>();
    for (const row of invRes.data ?? []) {
      const unit = unitMap.get(row.ingredient_id) ?? "g";
      inventoryMap.set(row.ingredient_id, { quantity: row.quantity, unit });
    }

    const recipeIds = (recipesRes.data ?? []).map((r) => r.id);
    if (recipeIds.length === 0) {
      return NextResponse.json({ recipes: [] });
    }

    const { data: riRows } = await supabase
      .from("recipe_ingredients")
      .select("recipe_id, ingredient_id, amount, unit")
      .in("recipe_id", recipeIds);

    const riByRecipe = new Map<string, { ingredient_id: string; amount: number; unit: string }[]>();
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

    return NextResponse.json({ recipes: suggested });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
