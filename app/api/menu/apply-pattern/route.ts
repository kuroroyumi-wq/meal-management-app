import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { GeneratedMenuJson } from "@/lib/claude";

const DAY_KEYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;
const MEAL_MAP = {
  breakfast: "朝食",
  lunch: "昼食",
  dinner: "夕食",
} as const;

function getDateForDay(weekStart: string, dayIndex: number): string {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + dayIndex);
  return d.toISOString().slice(0, 10);
}

/**
 * 10パターンから選んだ1案を献立として保存
 * body: { pattern: GeneratedMenuJson, week_start: string, headcount: number }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { pattern, week_start, headcount } = body;

    if (!pattern || !week_start || headcount == null) {
      return NextResponse.json(
        { error: "pattern, week_start, headcount は必須です" },
        { status: 400 }
      );
    }

    const start = new Date(String(week_start).trim());
    if (isNaN(start.getTime())) {
      return NextResponse.json(
        { error: "無効な week_start です" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: recipes } = await supabase
      .from("recipes")
      .select("id, name");
    const nameToId = new Map(
      (recipes ?? []).map((r) => [r.name.trim().toLowerCase(), r.id])
    );
    const nameToIdExact = new Map((recipes ?? []).map((r) => [r.name, r.id]));

    const menu_items: {
      date: string;
      meal_type: string;
      dish_role: string;
      display_order: number;
      recipe_id: string | null;
    }[] = [];
    const pat = pattern as GeneratedMenuJson;

    for (let i = 0; i < DAY_KEYS.length; i++) {
      const dayKey = DAY_KEYS[i];
      const dayData = pat[dayKey];
      if (!dayData || typeof dayData !== "object") continue;
      const dateStr = getDateForDay(String(week_start), i);
      for (const [mealEn, mealJa] of Object.entries(MEAL_MAP)) {
        const recipeName =
          String((dayData as unknown as Record<string, string>)[mealEn] ?? "").trim() || "";
        let recipeId: string | null = nameToIdExact.get(recipeName) ?? null;
        if (!recipeId && recipeName) {
          recipeId =
            nameToId.get(recipeName.toLowerCase()) ??
            [...nameToId.entries()].find(([k]) =>
              recipeName.toLowerCase().includes(k)
            )?.[1] ??
            null;
        }
        menu_items.push({
          date: dateStr,
          meal_type: mealJa,
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
      .select("id")
      .single();

    if (menuError || !menu?.id) {
      return NextResponse.json(
        { error: menuError?.message ?? "献立の作成に失敗しました" },
        { status: 500 }
      );
    }

    const toInsert = menu_items.map((m) => ({
      weekly_menu_id: menu.id,
      date: m.date,
      meal_type: m.meal_type,
      dish_role: m.dish_role,
      display_order: m.display_order,
      recipe_id: m.recipe_id,
      adjusted_servings: null,
    }));

    const { error: itemsError } = await supabase
      .from("menu_items")
      .insert(toInsert);

    if (itemsError) {
      await supabase.from("weekly_menus").delete().eq("id", menu.id);
      return NextResponse.json(
        { error: itemsError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ id: menu.id });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
