import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { ShiftTask, ShiftType } from "@/types";

type RouteParams = { params: Promise<{ id: string }> };

const SHIFTS: ShiftType[] = ["朝", "昼", "夕"];
function isValidShift(s: string): s is ShiftType {
  return SHIFTS.includes(s as ShiftType);
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { task, staff_id, is_done, shift } = body;

    const supabase = await createClient();

    const updates: Record<string, unknown> = {};
    if (typeof task === "string") updates.task = task.trim();
    if (staff_id !== undefined) updates.staff_id = staff_id != null && String(staff_id).trim() !== "" ? String(staff_id).trim() : null;
    if (typeof is_done === "boolean") updates.is_done = is_done;
    if (shift && isValidShift(shift)) updates.shift = shift;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "更新する項目がありません" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("shift_tasks")
      .update(updates)
      .eq("id", id)
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

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { error } = await supabase.from("shift_tasks").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
