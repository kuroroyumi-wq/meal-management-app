import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * スタッフへLINE通知を送る。
 * body: { staff_id?: string, line_user_id?: string, message: string }
 * staff_id または line_user_id のどちらか必須。message は省略時はデフォルト文。
 */
export async function POST(request: Request) {
  try {
    const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    if (!token || token.trim() === "") {
      return NextResponse.json(
        { error: "LINE通知は未設定です。.env.local に LINE_CHANNEL_ACCESS_TOKEN を設定してください。" },
        { status: 503 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { staff_id, line_user_id, message } = body;

    let toUserId: string | null = null;
    if (line_user_id && String(line_user_id).trim()) {
      toUserId = String(line_user_id).trim();
    } else if (staff_id && String(staff_id).trim()) {
      const supabase = await createClient();
      const { data } = await supabase
        .from("staff")
        .select("line_user_id")
        .eq("id", String(staff_id).trim())
        .single();
      toUserId = (data as { line_user_id: string | null } | null)?.line_user_id ?? null;
    }

    if (!toUserId) {
      return NextResponse.json(
        { error: "staff_id または line_user_id を指定するか、スタッフにLINEユーザーIDを登録してください。" },
        { status: 400 }
      );
    }

    const text = message && String(message).trim() ? String(message).trim() : "本日のシフトタスクをお知らせします。";

    const res = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        to: toUserId,
        messages: [{ type: "text", text }],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json(
        { error: `LINE API エラー: ${res.status} ${err}` },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
