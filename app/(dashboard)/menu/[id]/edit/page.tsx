"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Recipe } from "@/types";

const MEAL_TYPES = ["朝食", "昼食", "夕食"];

function getWeekDates(weekStart: string) {
  const start = new Date(weekStart);
  if (isNaN(start.getTime())) return [];
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

type MenuItemRow = {
  date: string;
  meal_type: string;
  recipe_id: string;
  adjusted_servings: string;
};

export default function MenuEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [weekStart, setWeekStart] = useState("");
  const [headcount, setHeadcount] = useState("30");
  const [status, setStatus] = useState<"draft" | "confirmed">("draft");
  const [rows, setRows] = useState<MenuItemRow[]>([]);

  useEffect(() => {
    if (!id) return;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [menuRes, recipesRes] = await Promise.all([
          fetch(`/api/menu/${id}`),
          fetch("/api/recipes"),
        ]);
        if (!menuRes.ok) {
          if (menuRes.status === 404) throw new Error("献立が見つかりません");
          throw new Error("取得に失敗しました");
        }
        const menu = await menuRes.json();
        setWeekStart(menu.week_start?.slice(0, 10) ?? "");
        setHeadcount(String(menu.headcount ?? 30));
        setStatus(menu.status === "confirmed" ? "confirmed" : "draft");

        const dates = getWeekDates(menu.week_start ?? "");
        const newRows: MenuItemRow[] = [];
        for (const date of dates) {
          for (const meal_type of MEAL_TYPES) {
            const existing = (menu.menu_items ?? []).find(
              (m: { date: string; meal_type: string }) =>
                m.date === date && m.meal_type === meal_type
            );
            newRows.push({
              date,
              meal_type,
              recipe_id: existing?.recipe_id ?? "",
              adjusted_servings: existing?.adjusted_servings != null
                ? String(existing.adjusted_servings)
                : "",
            });
          }
        }
        setRows(newRows);

        if (recipesRes.ok) {
          const data = await recipesRes.json();
          setRecipes(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const updateRow = (
    date: string,
    meal_type: string,
    field: keyof MenuItemRow,
    value: string
  ) => {
    setRows((r) =>
      r.map((row) =>
        row.date === date && row.meal_type === meal_type
          ? { ...row, [field]: value }
          : row
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weekStart.trim()) return;
    setError(null);
    try {
      const res = await fetch(`/api/menu/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          week_start: weekStart.trim(),
          headcount: Number(headcount) || 1,
          status,
          menu_items: rows
            .filter((r) => r.recipe_id)
            .map((r) => ({
              date: r.date,
              meal_type: r.meal_type,
              recipe_id: r.recipe_id,
              adjusted_servings:
                r.adjusted_servings !== ""
                  ? Number(r.adjusted_servings)
                  : null,
            })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "更新に失敗しました");
      router.push(`/menu/${id}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    }
  };

  if (loading) {
    return <p className="text-zinc-500 dark:text-zinc-400">読み込み中...</p>;
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Link
          href={`/menu/${id}`}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          ← 詳細
        </Link>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          献立を編集
        </h1>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                週の開始日 *
              </label>
              <input
                type="date"
                value={weekStart}
                onChange={(e) => setWeekStart(e.target.value)}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                人数 *
              </label>
              <input
                type="number"
                min="1"
                value={headcount}
                onChange={(e) => setHeadcount(e.target.value)}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                状態
              </label>
              <select
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as "draft" | "confirmed")
                }
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              >
                <option value="draft">下書き</option>
                <option value="confirmed">確定</option>
              </select>
            </div>
          </div>
        </div>

        {rows.length > 0 && (
          <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
            <h2 className="mb-3 font-semibold text-zinc-900 dark:text-zinc-50">
              献立（日付 × 食事区分）
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-600">
                    <th className="px-2 py-2 text-left font-medium text-zinc-700 dark:text-zinc-300">
                      日付
                    </th>
                    <th className="px-2 py-2 text-left font-medium text-zinc-700 dark:text-zinc-300">
                      区分
                    </th>
                    <th className="min-w-[180px] px-2 py-2 text-left font-medium text-zinc-700 dark:text-zinc-300">
                      レシピ
                    </th>
                    <th className="w-20 px-2 py-2 text-left font-medium text-zinc-700 dark:text-zinc-300">
                      人数
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr
                      key={`${row.date}-${row.meal_type}`}
                      className="border-b border-zinc-100 dark:border-zinc-700"
                    >
                      <td className="px-2 py-2 text-zinc-600 dark:text-zinc-400">
                        {row.date}
                      </td>
                      <td className="px-2 py-2 text-zinc-600 dark:text-zinc-400">
                        {row.meal_type}
                      </td>
                      <td className="px-2 py-2">
                        <select
                          value={row.recipe_id}
                          onChange={(e) =>
                            updateRow(
                              row.date,
                              row.meal_type,
                              "recipe_id",
                              e.target.value
                            )
                          }
                          className="w-full rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                        >
                          <option value="">未選択</option>
                          {recipes.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          min="1"
                          value={row.adjusted_servings}
                          onChange={(e) =>
                            updateRow(
                              row.date,
                              row.meal_type,
                              "adjusted_servings",
                              e.target.value
                            )
                          }
                          placeholder={headcount}
                          className="w-16 rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button type="submit">更新</Button>
          <Link
            href={`/menu/${id}`}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            キャンセル
          </Link>
        </div>
      </form>
    </div>
  );
}
