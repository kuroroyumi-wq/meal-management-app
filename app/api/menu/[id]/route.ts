import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type {
  WeeklyMenu,
  WeeklyMenuWithItems,
  MenuItemWithRecipe,
} from "@/types";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: menu, error: menuError } = await supabase
      .from("weekly_menus")
      .select("*")
      .eq("id", id)
      .single();

    if (menuError || !menu) {
      if (menuError?.code === "PGRST116") {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      return NextResponse.json(
        { error: menuError?.message ?? "Not found" },
        { status: 500 }
      );
    }

    const { data: items, error: itemsError } = await supabase
      .from("menu_items")
      .select(
        "id, weekly_menu_id, date, meal_type, dish_role, display_order, recipe_id, adjusted_servings"
      )
      .eq("weekly_menu_id", id)
      .order("date", { ascending: true })
      .order("meal_type", { ascending: true })
      .order("display_order", { ascending: true });

    const result: WeeklyMenuWithItems = { ...menu, menu_items: [] };

    if (!itemsError && items?.length) {
      const recipeIds = [
        ...new Set(items.map((i) => i.recipe_id).filter(Boolean)),
      ] as string[];
      const { data: recipes } = await supabase
        .from("recipes")
        .select("id, name, servings")
        .in("id", recipeIds);

      const recipeMap = new Map(
        (recipes ?? []).map((r) => [r.id, { name: r.name, servings: r.servings }])
      );

      result.menu_items = items.map((i): MenuItemWithRecipe => ({
        ...i,
        recipe: i.recipe_id ? recipeMap.get(i.recipe_id) ?? null : null,
      }));
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
    const { week_start, headcount, status, menu_items } = body;

    if (!week_start || headcount == null) {
      return NextResponse.json(
        { error: "week_start と headcount は必須です" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data: menu, error: menuError } = await supabase
      .from("weekly_menus")
      .update({
        week_start: String(week_start).trim(),
        headcount: Math.max(1, Number(headcount)),
        status: status === "confirmed" ? "confirmed" : "draft",
      })
      .eq("id", id)
      .select()
      .single();

    if (menuError) {
      return NextResponse.json({ error: menuError.message }, { status: 500 });
    }

    await supabase.from("menu_items").delete().eq("weekly_menu_id", id);

    const items = Array.isArray(menu_items)
      ? menu_items.filter(
          (m: { date?: string; meal_type?: string; dish_role?: string }) =>
            m.date && m.meal_type && m.dish_role
        )
      : [];

    if (items.length > 0) {
      const { error: itemsError } = await supabase.from("menu_items").insert(
        items.map(
          (m: {
            date: string;
            meal_type: string;
            dish_role: string;
            display_order?: number | null;
            recipe_id?: string | null;
            adjusted_servings?: number | null;
          }) => ({
            weekly_menu_id: id,
            date: String(m.date).trim(),
            meal_type: String(m.meal_type).trim(),
            dish_role: String(m.dish_role).trim(),
            display_order:
              m.display_order != null ? Number(m.display_order) : 0,
            recipe_id: m.recipe_id || null,
            adjusted_servings: m.adjusted_servings ?? null,
          })
        )
      );
      if (itemsError) {
        return NextResponse.json(
          {
            error:
              "献立は更新されましたが献立詳細の更新に失敗しました: " +
              itemsError.message,
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(menu as WeeklyMenu);
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
    const { error } = await supabase.from("weekly_menus").delete().eq("id", id);

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
