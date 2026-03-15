import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { Staff } from "@/types";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("staff")
      .select("*")
      .order("name");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json((data ?? []) as Staff[]);
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
    const { name, role, line_user_id } = body;

    if (!name || !String(name).trim()) {
      return NextResponse.json(
        { error: "name は必須です" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("staff")
      .insert({
        name: String(name).trim(),
        role: role != null && String(role).trim() !== "" ? String(role).trim() : null,
        line_user_id: line_user_id != null && String(line_user_id).trim() !== "" ? String(line_user_id).trim() : null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data as Staff);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
