import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { Ingredient } from "@/types";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("ingredients")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data as Ingredient[]);
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
    const { name, unit, unit_price, category, nutrition_per_100g } = body;

    if (!name || !unit) {
      return NextResponse.json(
        { error: "name と unit は必須です" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("ingredients")
      .insert({
        name: String(name).trim(),
        unit: String(unit).trim(),
        unit_price: unit_price != null ? Number(unit_price) : null,
        category:
          category != null && category !== "" ? String(category).trim() : null,
        nutrition_per_100g: nutrition_per_100g ?? null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data as Ingredient);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
