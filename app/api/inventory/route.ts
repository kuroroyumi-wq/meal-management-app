import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { InventoryWithIngredient } from "@/types";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: rows, error } = await supabase
      .from("inventory")
      .select("id, ingredient_id, quantity, updated_at")
      .order("updated_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!rows?.length) {
      return NextResponse.json([] as InventoryWithIngredient[]);
    }

    const ingredientIds = [...new Set(rows.map((r) => r.ingredient_id))];
    const { data: ingredients } = await supabase
      .from("ingredients")
      .select("id, name, unit")
      .in("id", ingredientIds);

    const ingMap = new Map(
      (ingredients ?? []).map((i) => [i.id, { name: i.name, unit: i.unit }])
    );

    const result: InventoryWithIngredient[] = rows.map((r) => ({
      ...r,
      ingredient: ingMap.get(r.ingredient_id) ?? null,
    }));

    return NextResponse.json(result);
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
    const { ingredient_id, quantity, unit_price, purchased_at } = body;

    if (!ingredient_id || quantity == null || Number(quantity) <= 0) {
      return NextResponse.json(
        { error: "ingredient_id と quantity は必須です（quantity は 0 より大きい値）" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const qty = Number(quantity);
    const price = unit_price != null ? Number(unit_price) : null;
    const date = purchased_at
      ? String(purchased_at).trim().slice(0, 10)
      : new Date().toISOString().slice(0, 10);

    const { error: purchaseError } = await supabase.from("purchases").insert({
      ingredient_id,
      quantity: qty,
      unit_price: price ?? 0,
      purchased_at: date,
    });

    if (purchaseError) {
      return NextResponse.json(
        { error: purchaseError.message },
        { status: 500 }
      );
    }

    const { data: existing } = await supabase
      .from("inventory")
      .select("id, quantity")
      .eq("ingredient_id", ingredient_id)
      .maybeSingle();

    if (existing) {
      const { error: updateError } = await supabase
        .from("inventory")
        .update({
          quantity: existing.quantity + qty,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);

      if (updateError) {
        return NextResponse.json(
          { error: "仕入れは記録されましたが在庫の更新に失敗しました: " + updateError.message },
          { status: 500 }
        );
      }
    } else {
      const { error: insertError } = await supabase.from("inventory").insert({
        ingredient_id,
        quantity: qty,
        updated_at: new Date().toISOString(),
      });

      if (insertError) {
        return NextResponse.json(
          { error: "仕入れは記録されましたが在庫の登録に失敗しました: " + insertError.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
