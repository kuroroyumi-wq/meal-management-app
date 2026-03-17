"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Recipe } from "@/types";

const MEAL_TYPES = ["朝食", "昼食", "夕食"];
const DISH_ROLES = [
  { value: "staple", label: "主食", order: 0 },
  { value: "main", label: "主菜", order: 1 },
  { value: "side", label: "副菜", order: 2 },
  { value: "soup", label: "汁物", order: 3 },
  { value: "dessert", label: "デザート", order: 4 },
] as const;

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
  dish_role: (typeof DISH_ROLES)[number]["value"];
  display_order: number;
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
  const [submitting, setSubmitting] = useState(false);

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
            for (const role of DISH_ROLES) {
              const existing = (menu.menu_items ?? []).find(
                (m: { date: string; meal_type: string; dish_role: string }) =>
                  m.date === date && m.meal_type === meal_type && m.dish_role === role.value
              );
              newRows.push({
                date,
                meal_type,
                dish_role: role.value,
                display_order: role.order,
                recipe_id: existing?.recipe_id ?? "",
                adjusted_servings:
                  existing?.adjusted_servings != null
                    ? String(existing.adjusted_servings)
                    : "",
              });
            }
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
    dish_role: MenuItemRow["dish_role"],
    field: keyof MenuItemRow,
    value: string
  ) => {
    setRows((r) =>
      r.map((row) =>
        row.date === date && row.meal_type === meal_type && row.dish_role === dish_role
          ? { ...row, [field]: value }
          : row
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weekStart.trim()) return;
    setError(null);
    setSubmitting(true);
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
              dish_role: r.dish_role,
              display_order: r.display_order,
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
    } finally {
      setSubmitting(false);
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
        <div className="mb-4">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-800/80">
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
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-800/80">
            <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              献立（日付 × 食事区分 × 役割）
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
                    <th className="px-2 py-2 text-left font-medium text-zinc-700 dark:text-zinc-300">
                      役割
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
                      key={`${row.date}-${row.meal_type}-${row.dish_role}`}
                      className="border-b border-zinc-100 dark:border-zinc-700"
                    >
                      <td className="px-2 py-2 text-zinc-600 dark:text-zinc-400">
                        {row.date}
                      </td>
                      <td className="px-2 py-2 text-zinc-600 dark:text-zinc-400">
                        {row.meal_type}
                      </td>
                      <td className="px-2 py-2 text-zinc-600 dark:text-zinc-400">
                        {DISH_ROLES.find((r) => r.value === row.dish_role)?.label ?? "—"}
                      </td>
                      <td className="px-2 py-2">
                        <select
                          value={row.recipe_id}
                          onChange={(e) =>
                            updateRow(
                              row.date,
                              row.meal_type,
                              row.dish_role,
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
                              row.dish_role,
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

        <div className="flex flex-wrap gap-3">
          <Link
            href={`/menu/${id}`}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            キャンセル
          </Link>
          <Button
            type="submit"
            className="ml-auto"
            disabled={submitting}
          >
            {submitting ? "更新中..." : "更新"}
          </Button>
        </div>
      </form>
    </div>
  );
}
