"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen, Copy, Search } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { MealType, Recipe, RecipeStatus } from "@/types";

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<RecipeStatus | "all">("all");
  const [mealTypeFilter, setMealTypeFilter] = useState<MealType | "all">("all");
  const [templateOnly, setTemplateOnly] = useState(false);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRecipes() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/recipes");
        if (!res.ok) throw new Error("一覧の取得に失敗しました");
        const data = await res.json();
        setRecipes(Array.isArray(data) ? data : []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
        setRecipes([]);
      } finally {
        setLoading(false);
      }
    }
    fetchRecipes();
  }, []);

  const visibleRecipes = useMemo(() => {
    const filtered = recipes.filter((r) => {
      if (!r.is_active && r.is_active !== undefined) return false;
      if (templateOnly && !r.is_template) return false;

      const status = (r.status ?? "draft") as RecipeStatus;
      if (statusFilter !== "all" && status !== statusFilter) return false;

      if (mealTypeFilter !== "all") {
        if ((r.meal_type ?? null) !== mealTypeFilter) return false;
      }

      if (search.trim()) {
        const q = search.trim().toLowerCase();
        if (!r.name.toLowerCase().includes(q)) return false;
      }
      return true;
    });

    // 現場では「定番が上」が探しやすいので、定番優先→新しい順に
    return filtered.sort((a, b) => {
      const aT = a.is_template ? 1 : 0;
      const bT = b.is_template ? 1 : 0;
      if (aT !== bT) return bT - aT;
      const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
      return bTime - aTime;
    });
  }, [recipes, search, statusFilter, mealTypeFilter, templateOnly]);

  async function handleDuplicate(id: string) {
    try {
      setDuplicatingId(id);
      setError(null);
      const res = await fetch(`/api/recipes/${id}/duplicate`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "複製に失敗しました");
      // 一覧を再取得
      const listRes = await fetch("/api/recipes");
      if (listRes.ok) {
        const list = await listRes.json();
        setRecipes(Array.isArray(list) ? list : []);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setDuplicatingId(null);
    }
  }

  return (
    <div>
      <div className="mb-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            レシピ一覧
          </h1>
          <div className="flex items-center gap-2">
            <Link
              href="/recipes/new?mode=simple"
              className={cn(buttonVariants({ variant: "secondary" }))}
            >
              簡易登録
            </Link>
            <Link
              href="/recipes/new"
              className={cn(buttonVariants({ variant: "default" }))}
            >
              通常登録
            </Link>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="レシピ名で検索"
              className="w-full rounded-md border border-zinc-300 bg-white py-2 pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as RecipeStatus | "all")
              }
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            >
              <option value="all">ステータス: すべて</option>
              <option value="draft">下書き</option>
              <option value="simple">簡易登録</option>
              <option value="published">完成済み</option>
            </select>
            <select
              value={mealTypeFilter}
              onChange={(e) =>
                setMealTypeFilter(e.target.value as MealType | "all")
              }
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            >
              <option value="all">食事区分: すべて</option>
              <option value="朝食">朝食</option>
              <option value="昼食">昼食</option>
              <option value="夕食">夕食</option>
            </select>
            <label className="inline-flex items-center gap-1 text-sm text-zinc-700 dark:text-zinc-200">
              <input
                type="checkbox"
                checked={templateOnly}
                onChange={(e) => setTemplateOnly(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:border-zinc-600"
              />
              定番のみ
            </label>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      ) : visibleRecipes.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="レシピがまだ登録されていません"
          description="レシピを登録すると、献立で使えるようになります"
          ctaLabel="最初のレシピを登録する"
          ctaHref="/recipes/new"
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
          <table className="w-full min-w-[500px] text-left text-base">
            <thead className="bg-zinc-100 dark:bg-zinc-800">
              <tr>
                <th className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                  レシピ名
                </th>
                <th className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                  区分
                </th>
                <th className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                  人数
                </th>
                <th className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                  ステータス
                </th>
                <th className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                  定番
                </th>
                <th className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                  作成日
                </th>
                <th className="w-40 px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
              {visibleRecipes.map((row) => (
                <tr
                  key={row.id}
                  className="bg-white transition-colors hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800/80"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/recipes/${row.id}`}
                      className="font-medium text-zinc-900 underline hover:text-zinc-600 dark:text-zinc-100 dark:hover:text-zinc-300"
                    >
                      {row.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {row.meal_type ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {row.servings}人前
                  </td>
                  <td className="px-4 py-3">
                    {(row.status ?? "draft") === "simple" && (
                      <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-100">
                        簡易
                      </span>
                    )}
                    {(row.status ?? "draft") === "draft" && (
                      <span className="inline-flex rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-100">
                        下書き
                      </span>
                    )}
                    {(row.status ?? "draft") === "published" && (
                      <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-100">
                        完成
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {row.is_template ? (
                      <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-100">
                        定番
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400">
                    {row.created_at
                      ? new Date(row.created_at).toLocaleDateString("ja-JP")
                      : "—"}
                  </td>
                  <td className="px-4 py-3 space-x-2 whitespace-nowrap">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="inline-flex min-h-10 min-w-10"
                      onClick={() => handleDuplicate(row.id)}
                      disabled={duplicatingId === row.id}
                    >
                      <Copy className="mr-1 h-4 w-4" />
                      {duplicatingId === row.id ? "コピー中..." : "コピー"}
                    </Button>
                    <Link
                      href={`/recipes/${row.id}`}
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                        "inline-flex min-h-10 min-w-10"
                      )}
                    >
                      編集
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
