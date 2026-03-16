import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type {
  Recipe,
  RecipeWithIngredients,
  RecipeIngredientWithName,
} from "@/types";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: recipe, error: recipeError } = await supabase
      .from("recipes")
      .select("*")
      .eq("id", id)
      .single();

    if (recipeError || !recipe) {
      if (recipeError?.code === "PGRST116") {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      return NextResponse.json(
        { error: recipeError?.message ?? "Not found" },
        { status: 500 }
      );
    }

    const { data: recipeIngredients, error: riError } = await supabase
      .from("recipe_ingredients")
      .select("id, recipe_id, ingredient_id, amount, unit")
      .eq("recipe_id", id);

    const result: RecipeWithIngredients = {
      ...recipe,
      recipe_ingredients: [],
    };

    if (!riError && recipeIngredients?.length) {
      const ingredientIds = [
        ...new Set(recipeIngredients.map((r) => r.ingredient_id)),
      ];
      const { data: ingredients } = await supabase
        .from("ingredients")
        .select("id, name, unit")
        .in("id", ingredientIds);

      const ingMap = new Map(
        (ingredients ?? []).map((i) => [i.id, { name: i.name, unit: i.unit }])
      );

      result.recipe_ingredients = recipeIngredients.map(
        (r): RecipeIngredientWithName => ({
          ...r,
          ingredient: ingMap.get(r.ingredient_id) ?? null,
        })
      );
    }

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      name,
      description,
      servings,
      meal_type,
      source_url,
      recipe_ingredients,
      status,
      is_template,
      is_active,
      base_recipe_id,
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
      .update({
        name: String(name).trim(),
        description:
          description != null && description !== ""
            ? String(description).trim()
            : null,
        servings: servings != null ? Math.max(1, Number(servings)) : 1,
        meal_type:
          meal_type != null && meal_type !== ""
            ? String(meal_type).trim()
            : null,
        source_url:
          source_url != null && source_url !== ""
            ? String(source_url).trim()
            : null,
        status:
          status != null && status !== ""
            ? String(status).trim()
            : "draft",
        is_template: typeof is_template === "boolean" ? is_template : false,
        is_active: is_active === false ? false : true,
        base_recipe_id:
          base_recipe_id != null && base_recipe_id !== ""
            ? String(base_recipe_id)
            : null,
      })
      .eq("id", id)
      .select()
      .single();

    if (recipeError) {
      return NextResponse.json(
        { error: recipeError.message },
        { status: 500 }
      );
    }

    await supabase.from("recipe_ingredients").delete().eq("recipe_id", id);

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
            recipe_id: id,
            ingredient_id: r.ingredient_id,
            amount: Number(r.amount),
            unit: String(r.unit).trim(),
          })
        )
      );
      if (riError) {
        return NextResponse.json(
          {
            error:
              "レシピは更新されましたが材料の更新に失敗しました: " + riError.message,
          },
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

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { error } = await supabase.from("recipes").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
