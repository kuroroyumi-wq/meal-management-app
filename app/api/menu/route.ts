import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { WeeklyMenu } from "@/types";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("weekly_menus")
      .select("*")
      .order("week_start", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data as WeeklyMenu[]);
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
      .insert({
        week_start: String(week_start).trim(),
        headcount: Math.max(1, Number(headcount)),
        status: status === "confirmed" ? "confirmed" : "draft",
      })
      .select()
      .single();

    if (menuError) {
      return NextResponse.json({ error: menuError.message }, { status: 500 });
    }

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
            weekly_menu_id: menu.id,
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
              "献立は作成されましたが献立詳細の登録に失敗しました: " +
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
