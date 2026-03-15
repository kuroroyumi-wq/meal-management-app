import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { ShiftTask, ShiftType } from "@/types";

const SHIFTS: ShiftType[] = ["朝", "昼", "夕"];

function isValidShift(s: string): s is ShiftType {
  return SHIFTS.includes(s as ShiftType);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const shift = searchParams.get("shift");

    const supabase = await createClient();
    let query = supabase
      .from("shift_tasks")
      .select("*, staff:staff_id(name)")
      .order("date", { ascending: true })
      .order("shift", { ascending: true });

    if (date) query = query.eq("date", date);
    if (shift && isValidShift(shift)) query = query.eq("shift", shift);

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json((data ?? []) as (ShiftTask & { staff?: { name: string } | null })[]);
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
    const { date, shift, staff_id, task } = body;

    if (!date || !shift || !task || !String(task).trim()) {
      return NextResponse.json(
        { error: "date, shift, task は必須です" },
        { status: 400 }
      );
    }
    if (!isValidShift(shift)) {
      return NextResponse.json(
        { error: "shift は 朝, 昼, 夕 のいずれかです" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("shift_tasks")
      .insert({
        date: String(date).trim(),
        shift,
        staff_id: staff_id != null && String(staff_id).trim() !== "" ? String(staff_id).trim() : null,
        task: String(task).trim(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data as ShiftTask);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
