import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { Recipe } from "@/types";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("recipes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data as Recipe[]);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      servings,
      meal_type,
      source_url,
      recipe_ingredients,
    } = body;

    if (!name || name.toString().trim() === "") {
      return NextResponse.json(
        { error: "name は必須です" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data: recipe, error: recipeError } = await supabase
      .from("recipes")
      .insert({
        name: String(name).trim(),
        description:
          description != null && description !== ""
            ? String(description).trim()
            : null,
        servings: servings != null ? Math.max(1, Number(servings)) : 1,
        meal_type:
          meal_type != null && meal_type !== "" ? String(meal_type).trim() : null,
        source_url:
          source_url != null && source_url !== ""
            ? String(source_url).trim()
            : null,
      })
      .select()
      .single();

    if (recipeError) {
      return NextResponse.json(
        { error: recipeError.message },
        { status: 500 }
      );
    }

    const ingredients = Array.isArray(recipe_ingredients)
      ? recipe_ingredients.filter(
          (r: { ingredient_id?: string; amount?: number; unit?: string }) =>
            r.ingredient_id && Number(r.amount) > 0 && r.unit
        )
      : [];

    if (ingredients.length > 0) {
      const { error: riError } = await supabase.from("recipe_ingredients").insert(
        ingredients.map(
          (r: { ingredient_id: string; amount: number; unit: string }) => ({
            recipe_id: recipe.id,
            ingredient_id: r.ingredient_id,
            amount: Number(r.amount),
            unit: String(r.unit).trim(),
          })
        )
      );
      if (riError) {
        return NextResponse.json(
          { error: "レシピは作成されましたが材料の登録に失敗しました: " + riError.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(recipe as Recipe);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
