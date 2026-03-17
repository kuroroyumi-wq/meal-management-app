import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export interface DashboardStats {
  ingredientsCount: number;
  recipesCount: number;
  menusCount: number;
  hasMenuThisWeek: boolean;
  /** 今月の原価合計（円） */
  monthlyCostTotal: number;
  /** 今日の献立 { 朝食, 昼食, 夕食 } レシピ名 */
  todayMenu: { breakfast: string; lunch: string; dinner: string };
  /** 最近追加した食材（最大5件） */
  recentIngredients: { id: string; name: string }[];
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

function getThisMonth() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { start, end } = getWeekRange();
    const today = new Date().toISOString().slice(0, 10);
    const month = getThisMonth();

    const [
      ingRes,
      recRes,
      menuRes,
      weekRes,
      purchasesRes,
      todayItemsRes,
      recentIngRes,
    ] = await Promise.all([
      supabase.from("ingredients").select("id", { count: "exact", head: true }),
      supabase.from("recipes").select("id", { count: "exact", head: true }),
      supabase.from("weekly_menus").select("id", { count: "exact", head: true }),
      supabase
        .from("weekly_menus")
        .select("id")
        .gte("week_start", start)
        .lte("week_start", end)
        .limit(1),
      supabase
        .from("purchases")
        .select("quantity, unit_price, purchased_at")
        .gte("purchased_at", `${month}-01`)
        .lt("purchased_at", `${month}-32`),
      supabase
        .from("menu_items")
        .select("meal_type, recipe_id, dish_role, display_order")
        .eq("date", today)
        .order("display_order", { ascending: true }),
      supabase
        .from("ingredients")
        .select("id, name")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    let monthlyCostTotal = 0;
    for (const r of purchasesRes.data ?? []) {
      monthlyCostTotal += Number(r.quantity) * Number(r.unit_price);
    }

    const todayMenu = {
      breakfast: "",
      lunch: "",
      dinner: "",
    };
    const mealKey: Record<string, keyof typeof todayMenu> = {
      朝食: "breakfast",
      昼食: "lunch",
      夕食: "dinner",
    };
    const recipeIds = [
      ...new Set(
        (todayItemsRes.data ?? []).map((i) => i.recipe_id).filter(Boolean)
      ),
    ] as string[];
    if (recipeIds.length > 0) {
      const { data: recipes } = await supabase
        .from("recipes")
        .select("id, name")
        .in("id", recipeIds);
      const nameMap = new Map((recipes ?? []).map((r) => [r.id, r.name]));
      // 1食に複数品があるため、まずは display_order 最小の1品を「今日の献立」として表示
      const picked = new Set<string>();
      for (const i of todayItemsRes.data ?? []) {
        if (picked.has(i.meal_type)) continue;
        const key = mealKey[i.meal_type];
        if (key) {
          todayMenu[key] = i.recipe_id ? nameMap.get(i.recipe_id) ?? "—" : "—";
          picked.add(i.meal_type);
        }
      }
    }

    const stats: DashboardStats = {
      ingredientsCount: ingRes.count ?? 0,
      recipesCount: recRes.count ?? 0,
      menusCount: menuRes.count ?? 0,
      hasMenuThisWeek: (weekRes.data?.length ?? 0) > 0,
      monthlyCostTotal,
      todayMenu,
      recentIngredients: (recentIngRes.data ?? []).map((r) => ({
        id: r.id,
        name: r.name,
      })),
    };

    return NextResponse.json(stats);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
