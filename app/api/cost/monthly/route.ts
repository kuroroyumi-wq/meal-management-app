import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { MonthlyCostSummary } from "@/types";

const MEAL_PRICE: Record<string, number> = {
  朝食: 200,
  昼食: 500,
  夕食: 500,
};

export async function GET() {
  try {
    const supabase = await createClient();

    const [purchasesRes, menuItemsRes] = await Promise.all([
      supabase.from("purchases").select("quantity, unit_price, purchased_at"),
      supabase.from("menu_items").select("date, meal_type, adjusted_servings, weekly_menu_id"),
    ]);

    if (purchasesRes.error) {
      return NextResponse.json({ error: purchasesRes.error.message }, { status: 500 });
    }

    const byMonth = new Map<string, { total: number; count: number }>();
    for (const r of purchasesRes.data ?? []) {
      const month = String(r.purchased_at).slice(0, 7);
      const total = r.quantity * r.unit_price;
      const cur = byMonth.get(month) ?? { total: 0, count: 0 };
      byMonth.set(month, { total: cur.total + total, count: cur.count + 1 });
    }

    let revenueByMonth = new Map<string, number>();
    if (menuItemsRes.data?.length && !menuItemsRes.error) {
      const menuIds = [...new Set(menuItemsRes.data.map((m) => m.weekly_menu_id))];
      const { data: menus } = await supabase
        .from("weekly_menus")
        .select("id, headcount")
        .in("id", menuIds);
      const headcountMap = new Map((menus ?? []).map((m) => [m.id, m.headcount]));

      for (const m of menuItemsRes.data) {
        const month = String(m.date).slice(0, 7);
        const servings = m.adjusted_servings ?? headcountMap.get(m.weekly_menu_id) ?? 0;
        const price = MEAL_PRICE[m.meal_type] ?? 0;
        revenueByMonth.set(month, (revenueByMonth.get(month) ?? 0) + price * servings);
      }
    }

    const months = new Set([...byMonth.keys(), ...revenueByMonth.keys()]);
    const result: MonthlyCostSummary[] = [...months]
      .map((month) => ({
        month,
        total_cost: byMonth.get(month)?.total ?? 0,
        purchase_count: byMonth.get(month)?.count ?? 0,
        revenue: revenueByMonth.get(month) ?? 0,
      }))
      .sort((a, b) => b.month.localeCompare(a.month));

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
