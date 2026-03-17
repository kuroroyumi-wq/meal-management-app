import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { canMakeFromInventory } from "@/lib/inventory-recipes";

const MEAL_TYPES = ["朝食", "昼食", "夕食"];

/**
 * 余り食材で作れるレシピで1週間分の献立を自動作成
 * body: { week_start: string (YYYY-MM-DD), headcount: number }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const week_start = body.week_start;
    const headcount = body.headcount ?? 1;

    if (!week_start || !String(week_start).trim()) {
      return NextResponse.json(
        { error: "week_start は必須です（YYYY-MM-DD）" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const [invRes, recipesRes] = await Promise.all([
      supabase.from("inventory").select("ingredient_id, quantity").gt("quantity", 0),
      supabase.from("recipes").select("id, name").order("name"),
    ]);

    if (invRes.error || recipesRes.error) {
      return NextResponse.json(
        { error: "在庫またはレシピの取得に失敗しました" },
        { status: 500 }
      );
    }

    const ingredients = await supabase
      .from("ingredients")
      .select("id, unit")
      .in("id", [...new Set((invRes.data ?? []).map((r) => r.ingredient_id))]);
    const unitMap = new Map((ingredients.data ?? []).map((i) => [i.id, i.unit]));

    const inventoryMap = new Map<string, { quantity: number; unit: string }>();
    for (const row of invRes.data ?? []) {
      inventoryMap.set(row.ingredient_id, {
        quantity: row.quantity,
        unit: unitMap.get(row.ingredient_id) ?? "g",
      });
    }

    const { data: riRows } = await supabase
      .from("recipe_ingredients")
      .select("recipe_id, ingredient_id, amount, unit")
      .in("recipe_id", (recipesRes.data ?? []).map((r) => r.id));

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

    const suggestedIds = (recipesRes.data ?? [])
      .filter((r) => canMakeFromInventory(riByRecipe.get(r.id) ?? [], inventoryMap))
      .map((r) => r.id);

    if (suggestedIds.length === 0) {
      return NextResponse.json(
        { error: "在庫から作れるレシピがありません" },
        { status: 400 }
      );
    }

    const start = new Date(String(week_start).trim());
    if (isNaN(start.getTime())) {
      return NextResponse.json({ error: "無効な week_start です" }, { status: 400 });
    }

    const menu_items: {
      date: string;
      meal_type: string;
      dish_role: string;
      display_order: number;
      recipe_id: string | null;
    }[] = [];
    let recipeIndex = 0;
    for (let d = 0; d < 7; d++) {
      const date = new Date(start);
      date.setDate(date.getDate() + d);
      const dateStr = date.toISOString().slice(0, 10);
      for (const meal_type of MEAL_TYPES) {
        const recipeId = suggestedIds[recipeIndex % suggestedIds.length];
        recipeIndex++;
        menu_items.push({
          date: dateStr,
          meal_type,
          dish_role: "main",
          display_order: 1,
          recipe_id: recipeId,
        });
      }
    }

    const { data: menu, error: menuError } = await supabase
      .from("weekly_menus")
      .insert({
        week_start: String(week_start).trim(),
        headcount: Math.max(1, Number(headcount)),
        status: "draft",
      })
      .select()
      .single();

    if (menuError) {
      return NextResponse.json({ error: menuError.message }, { status: 500 });
    }

    const { error: itemsError } = await supabase.from("menu_items").insert(
      menu_items.map((m) => ({
        weekly_menu_id: menu.id,
        date: m.date,
        meal_type: m.meal_type,
        dish_role: m.dish_role,
        display_order: m.display_order,
        recipe_id: m.recipe_id,
        adjusted_servings: null,
      }))
    );

    if (itemsError) {
      return NextResponse.json(
        { error: "献立の作成に失敗しました: " + itemsError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ id: menu.id, week_start: menu.week_start });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
