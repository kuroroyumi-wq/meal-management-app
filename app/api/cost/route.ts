import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { PurchaseWithIngredient } from "@/types";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month"); // YYYY-MM

    const supabase = await createClient();
    let query = supabase
      .from("purchases")
      .select("id, ingredient_id, quantity, unit_price, purchased_at, receipt_image_url, created_at")
      .order("purchased_at", { ascending: false });

    if (month) {
      const start = `${month}-01`;
      const [y, m] = month.split("-").map(Number);
      const end = new Date(y, m, 0);
      const endStr = end.toISOString().slice(0, 10);
      query = query.gte("purchased_at", start).lte("purchased_at", endStr);
    }

    const { data: rows, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!rows?.length) {
      return NextResponse.json([] as PurchaseWithIngredient[]);
    }

    const ingredientIds = [...new Set(rows.map((r) => r.ingredient_id))];
    const { data: ingredients } = await supabase
      .from("ingredients")
      .select("id, name, unit")
      .in("id", ingredientIds);

    const ingMap = new Map(
      (ingredients ?? []).map((i) => [i.id, { name: i.name, unit: i.unit }])
    );

    const result: PurchaseWithIngredient[] = rows.map((r) => ({
      ...r,
      ingredient: ingMap.get(r.ingredient_id) ?? null,
      total: r.quantity * r.unit_price,
    }));

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
