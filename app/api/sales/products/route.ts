import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { SalesProduct } from "@/types";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("sales_products")
      .select("*")
      .order("name");

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json((data ?? []) as SalesProduct[]);
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
    const { name, product_type, unit_price } = body;

    if (!name || !String(name).trim()) {
      return NextResponse.json({ error: "name は必須です" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("sales_products")
      .insert({
        name: String(name).trim(),
        product_type: product_type === "frozen" ? "frozen" : "chilled",
        unit_price: Number(unit_price) || 0,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data as SalesProduct);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
