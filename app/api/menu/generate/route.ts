import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { generateWeeklyMenu } from "@/lib/claude";

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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { week_start, headcount, budget_per_day } = body;

    if (!week_start || headcount == null) {
      return NextResponse.json(
        { error: "week_start と headcount は必須です" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const [recipesRes, ingredientsRes, recentMenusRes] = await Promise.all([
      supabase.from("recipes").select("id, name"),
      supabase.from("ingredients").select("name"),
      supabase
        .from("weekly_menus")
        .select("week_start, headcount")
        .order("week_start", { ascending: false })
        .limit(4),
    ]);

    const recipes = (recipesRes.data ?? []) as { id: string; name: string }[];
    const ingredients = (ingredientsRes.data ?? []) as { name: string }[];
    const recentMenus = (recentMenusRes.data ?? []) as {
      week_start: string;
      headcount: number;
    }[];

    const recipeNames = recipes.map((r) => r.name);
    const ingredientNames = ingredients.map((i) => i.name);
    const recentMenuSummary = recentMenus
      .map((m) => `週${m.week_start} ${m.headcount}名`)
      .join("\n");

    const generated = await generateWeeklyMenu({
      weekStart: String(week_start).trim(),
      headcount: Math.max(1, Number(headcount)),
      budgetPerDay:
        budget_per_day != null ? Number(budget_per_day) : undefined,
      recipeNames,
      ingredientNames,
      recentMenuSummary: recentMenuSummary || undefined,
    });

    const recipeNameToId = new Map(recipes.map((r) => [r.name, r.id]));

    const menu_items: {
      date: string;
      meal_type: string;
      recipe_id: string | null;
      recipe_name: string;
    }[] = [];

    for (let i = 0; i < DAY_KEYS.length; i++) {
      const dayKey = DAY_KEYS[i];
      const dayData = generated[dayKey];
      if (!dayData) continue;
      const date = getDateForDay(String(week_start).trim(), i);
      for (const [key, mealType] of Object.entries(MEAL_MAP)) {
        const recipeName =
          (dayData as unknown as Record<string, string>)[key]?.trim() || "";
        const recipe_id = recipeName ? recipeNameToId.get(recipeName) ?? null : null;
        menu_items.push({
          date,
          meal_type: mealType,
          recipe_id,
          recipe_name: recipeName || "—",
        });
      }
    }

    return NextResponse.json({
      week_start: String(week_start).trim(),
      headcount: Math.max(1, Number(headcount)),
      menu_items,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "献立の生成に失敗しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
