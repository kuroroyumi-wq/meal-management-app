import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export interface DashboardStats {
  ingredientsCount: number;
  recipesCount: number;
  menusCount: number;
  hasMenuThisWeek: boolean;
}

function getWeekRange() {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    start: monday.toISOString().slice(0, 10),
    end: sunday.toISOString().slice(0, 10),
  };
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { start, end } = getWeekRange();

    const [ingRes, recRes, menuRes, weekRes] = await Promise.all([
      supabase.from("ingredients").select("id", { count: "exact", head: true }),
      supabase.from("recipes").select("id", { count: "exact", head: true }),
      supabase.from("weekly_menus").select("id", { count: "exact", head: true }),
      supabase
        .from("weekly_menus")
        .select("id")
        .gte("week_start", start)
        .lte("week_start", end)
        .limit(1),
    ]);

    const stats: DashboardStats = {
      ingredientsCount: ingRes.count ?? 0,
      recipesCount: recRes.count ?? 0,
      menusCount: menuRes.count ?? 0,
      hasMenuThisWeek: (weekRes.data?.length ?? 0) > 0,
    };

    return NextResponse.json(stats);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
