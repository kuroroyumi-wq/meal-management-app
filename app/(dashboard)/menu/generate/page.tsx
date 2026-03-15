"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type MenuItem = {
  date: string;
  meal_type: string;
  recipe_id: string | null;
  recipe_name: string;
};

type GeneratedResult = {
  week_start: string;
  headcount: number;
  menu_items: MenuItem[];
};

export default function MenuGeneratePage() {
  const router = useRouter();
  const [weekStart, setWeekStart] = useState("");
  const [headcount, setHeadcount] = useState("30");
  const [budgetPerDay, setBudgetPerDay] = useState("");
  const [generating, setGenerating] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GeneratedResult | null>(null);

  const handleGenerate = async () => {
    if (!weekStart.trim()) return;
    setGenerating(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/menu/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          week_start: weekStart.trim(),
          headcount: Number(headcount) || 30,
          budget_per_day:
            budgetPerDay !== "" ? Number(budgetPerDay) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "生成に失敗しました");
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setGenerating(false);
    }
  };

  const handleCreateMenu = async () => {
    if (!result) return;
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          week_start: result.week_start,
          headcount: result.headcount,
          status: "draft",
          menu_items: result.menu_items.map((m) => ({
            date: m.date,
            meal_type: m.meal_type,
            recipe_id: m.recipe_id,
            adjusted_servings: null,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "献立の作成に失敗しました");
      router.push(`/menu/${data.id}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setCreating(false);
    }
  };

  const byDate =
    result?.menu_items.reduce<Record<string, MenuItem[]>>((acc, item) => {
      if (!acc[item.date]) acc[item.date] = [];
      acc[item.date].push(item);
      return acc;
    }, {}) ?? {};
  const dates = Object.keys(byDate).sort();

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Link
          href="/menu"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          ← 献立一覧
        </Link>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          AI献立生成
        </h1>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="mb-8 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
        <h2 className="mb-3 font-semibold text-zinc-900 dark:text-zinc-50">
          条件を入力
        </h2>
        <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">
          ANTHROPIC_API_KEY が .env.local に設定されている必要があります。登録済みのレシピ・食材を参考に、1週間の献立を提案します。
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              週の開始日 *
            </label>
            <input
              type="date"
              value={weekStart}
              onChange={(e) => setWeekStart(e.target.value)}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
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
              1日あたり予算（円）
            </label>
            <input
              type="number"
              min="0"
              value={budgetPerDay}
              onChange={(e) => setBudgetPerDay(e.target.value)}
              placeholder="未入力可"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
          <div className="flex items-end">
            <Button
              onClick={handleGenerate}
              disabled={generating || !weekStart}
            >
              {generating ? "生成中..." : "献立を生成"}
            </Button>
          </div>
        </div>
      </div>

      {result && (
        <>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">
              提案献立
            </h2>
            <Button
              onClick={handleCreateMenu}
              disabled={creating}
            >
              {creating ? "作成中..." : "この献立で作成"}
            </Button>
          </div>
          <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
            <table className="w-full text-sm">
              <thead className="bg-zinc-100 dark:bg-zinc-800">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-zinc-900 dark:text-zinc-50">
                    日付
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-900 dark:text-zinc-50">
                    朝食
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-900 dark:text-zinc-50">
                    昼食
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-900 dark:text-zinc-50">
                    夕食
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                {dates.map((date) => {
                  const dayItems = byDate[date];
                  const byMeal = dayItems.reduce<Record<string, string>>(
                    (acc, i) => {
                      acc[i.meal_type] = i.recipe_name;
                      return acc;
                    },
                    {}
                  );
                  return (
                    <tr key={date} className="bg-white dark:bg-zinc-900">
                      <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                        {date}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                        {byMeal["朝食"] ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                        {byMeal["昼食"] ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                        {byMeal["夕食"] ?? "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            レシピ名が登録レシピと一致した場合は自動で紐づきます。一致しない場合は「この献立で作成」後に編集でレシピを選択できます。
          </p>
        </>
      )}
    </div>
  );
}
