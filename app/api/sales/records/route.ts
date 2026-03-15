import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { SalesRecordWithProduct } from "@/types";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");

    const supabase = await createClient();
    let query = supabase
      .from("sales_records")
      .select("*, sales_products(name, unit_price, product_type)")
      .order("sold_at", { ascending: false });

    if (month && /^\d{4}-\d{2}$/.test(month)) {
      query = query.gte("sold_at", `${month}-01`).lte("sold_at", `${month}-31`);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const result = (data ?? []).map((r) => {
      const row = r as Record<string, unknown>;
      const product = row.sales_products ?? null;
      const { sales_products: _, ...rest } = row;
      return { ...rest, product } as SalesRecordWithProduct;
    });
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
    const { product_id, quantity, sold_at } = body;

    if (!product_id || quantity == null || !sold_at) {
      return NextResponse.json(
        { error: "product_id, quantity, sold_at は必須です" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("sales_records")
      .insert({
        product_id: String(product_id).trim(),
        quantity: Math.max(1, Number(quantity)),
        sold_at: String(sold_at).trim().slice(0, 10),
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
