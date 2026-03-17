import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { Recipe } from "@/types";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: original, error: recipeError } = await supabase
      .from("recipes")
      .select("*")
      .eq("id", id)
      .single();

    if (recipeError || !original) {
      return NextResponse.json(
        { error: recipeError?.message ?? "レシピが見つかりません" },
        { status: 404 }
      );
    }

    const { data: copied, error: insertError } = await supabase
      .from("recipes")
      .insert({
        name: `${original.name} のコピー`,
        description: original.description,
        cutting_notes: original.cutting_notes ?? null,
        servings: original.servings,
        meal_type: original.meal_type,
        source_url: original.source_url,
        status: "draft",
        is_template: false,
        base_recipe_id: original.id,
        is_active: true,
      })
      .select()
      .single();

    if (insertError || !copied) {
      return NextResponse.json(
        { error: insertError?.message ?? "複製に失敗しました" },
        { status: 500 }
      );
    }

    const { data: ingredients, error: riError } = await supabase
      .from("recipe_ingredients")
      .select("ingredient_id, amount, unit")
      .eq("recipe_id", id);

    if (!riError && ingredients && ingredients.length > 0) {
      const { error: insertRiError } = await supabase
        .from("recipe_ingredients")
        .insert(
          ingredients.map((r) => ({
            recipe_id: copied.id,
            ingredient_id: r.ingredient_id,
            amount: r.amount,
            unit: r.unit,
          }))
        );

      if (insertRiError) {
        return NextResponse.json(
          {
            error:
              "レシピは複製されましたが、材料のコピーに失敗しました: " +
              insertRiError.message,
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(copied as Recipe);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

