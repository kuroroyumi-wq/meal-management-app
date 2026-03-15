import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

type RouteParams = { params: Promise<{ id: string }> };

export interface RecipeNutritionResponse {
  per_serving: {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
  };
  servings: number;
}

/** 単位が g のときは amount をグラムとして扱う */
function amountToGrams(amount: number, unit: string): number {
  const u = unit.toLowerCase().trim();
  if (u === "g" || u === "グラム") return amount;
  if (u === "kg") return amount * 1000;
  if (u === "ml" || u === "cc") return amount;
  if (u === "l") return amount * 1000;
  return 0;
}

export async function GET(
  _request: Request,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: recipe, error: recipeError } = await supabase
      .from("recipes")
      .select("id, servings")
      .eq("id", id)
      .single();

    if (recipeError || !recipe) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { data: ri, error: riError } = await supabase
      .from("recipe_ingredients")
      .select("ingredient_id, amount, unit")
      .eq("recipe_id", id);

    if (riError || !ri?.length) {
      return NextResponse.json(
        {
          per_serving: { calories: 0, protein: 0, fat: 0, carbs: 0 },
          servings: recipe.servings,
        } as RecipeNutritionResponse
      );
    }

    const ingredientIds = [...new Set(ri.map((r) => r.ingredient_id))];
    const { data: ingredients } = await supabase
      .from("ingredients")
      .select("id, nutrition_per_100g")
      .in("id", ingredientIds);

    const ingMap = new Map(
      (ingredients ?? []).map((i) => [
        i.id,
        (i as { nutrition_per_100g: { calories?: number; protein?: number; fat?: number; carbs?: number } | null })
          .nutrition_per_100g,
      ])
    );

    let totalCalories = 0;
    let totalProtein = 0;
    let totalFat = 0;
    let totalCarbs = 0;

    for (const r of ri) {
      const grams = amountToGrams(Number(r.amount), r.unit);
      if (grams <= 0) continue;
      const n = ingMap.get(r.ingredient_id);
      if (!n) continue;
      const ratio = grams / 100;
      totalCalories += (n.calories ?? 0) * ratio;
      totalProtein += (n.protein ?? 0) * ratio;
      totalFat += (n.fat ?? 0) * ratio;
      totalCarbs += (n.carbs ?? 0) * ratio;
    }

    const servings = Math.max(1, Number(recipe.servings));
    const perServing = {
      calories: Math.round(totalCalories / servings),
      protein: Math.round((totalProtein / servings) * 10) / 10,
      fat: Math.round((totalFat / servings) * 10) / 10,
      carbs: Math.round((totalCarbs / servings) * 10) / 10,
    };

    return NextResponse.json({
      per_serving: perServing,
      servings,
    } as RecipeNutritionResponse);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
