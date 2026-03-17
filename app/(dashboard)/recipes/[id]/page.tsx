"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { RecipeWithIngredients } from "@/types";

export default function RecipeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [recipe, setRecipe] = useState<RecipeWithIngredients | null>(null);
  const [nutrition, setNutrition] = useState<{
    per_serving: { calories: number; protein: number; fat: number; carbs: number };
    servings: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [scaleCount, setScaleCount] = useState<number>(1);

  useEffect(() => {
    if (!id) return;
    async function fetchRecipe() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/recipes/${id}`);
        if (!res.ok) {
          if (res.status === 404) throw new Error("レシピが見つかりません");
          throw new Error("取得に失敗しました");
        }
        const data = await res.json();
        setRecipe(data);
        if (data?.servings) setScaleCount(Number(data.servings));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
        setRecipe(null);
      } finally {
        setLoading(false);
      }
    }
    fetchRecipe();
  }, [id]);

  useEffect(() => {
    if (!id || !recipe) return;
    fetch(`/api/recipes/${id}/nutrition`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => data && setNutrition(data))
      .catch(() => setNutrition(null));
  }, [id, recipe?.id]);

  const handleDelete = async () => {
    if (!confirm("このレシピを削除しますか？")) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/recipes/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("削除に失敗しました");
      router.push("/recipes");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <p className="text-zinc-500 dark:text-zinc-400">読み込み中...</p>;
  }

  if (error || !recipe) {
    return (
      <div>
        <p className="mb-4 text-red-600 dark:text-red-400">{error ?? "Not found"}</p>
        <Link
          href="/recipes"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          一覧へ戻る
        </Link>
      </div>
    );
  }

  return (
    <div className="print:py-4">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 print:mb-4">
        <div className="flex items-center gap-4">
          <Link
            href="/recipes"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "print:hidden")}
          >
            ← 一覧
          </Link>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            {recipe.name}
          </h1>
        </div>
        <div className="flex gap-2 print:hidden">
          <Link
            href={`/recipes/${id}/edit`}
            className={cn(buttonVariants({ size: "sm" }))}
          >
            編集
          </Link>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? "削除中..." : "削除"}
          </Button>
        </div>
      </div>

      <section className="space-y-6 print:space-y-5" aria-label="調理指示書">
        <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200 print:text-base">
          調理指示書
        </h2>

        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800/50 print:border print:shadow-none">
          <dl className="grid gap-2 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-zinc-500 dark:text-zinc-400">人数</dt>
              <dd className="font-medium text-zinc-900 dark:text-zinc-100">
                {recipe.servings}人前
              </dd>
            </div>
            <div>
              <dt className="text-sm text-zinc-500 dark:text-zinc-400">食事区分</dt>
              <dd className="font-medium text-zinc-900 dark:text-zinc-100">
                {recipe.meal_type ?? "—"}
              </dd>
            </div>
            {nutrition?.per_serving && (
              <div className="sm:col-span-2">
                <dt className="text-sm text-zinc-500 dark:text-zinc-400">
                  1人前の栄養素（目安）
                </dt>
                <dd className="mt-1 flex flex-wrap gap-4 text-zinc-700 dark:text-zinc-300">
                  <span>熱量 {nutrition.per_serving.calories} kcal</span>
                  <span>タンパク質 {nutrition.per_serving.protein} g</span>
                  <span>脂質 {nutrition.per_serving.fat} g</span>
                  <span>炭水化物 {nutrition.per_serving.carbs} g</span>
                </dd>
              </div>
            )}
          </dl>
        </div>

        {recipe.recipe_ingredients && recipe.recipe_ingredients.length > 0 && (
          <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800/50 print:border print:shadow-none">
            <h3 className="mb-3 font-semibold text-zinc-900 dark:text-zinc-50 print:text-sm">
              材料
            </h3>
            <div className="mb-3 flex items-center gap-2">
              <label className="text-sm text-zinc-600 dark:text-zinc-400">
                人数で必要量を計算:
              </label>
              <input
                type="number"
                min="1"
                value={scaleCount}
                onChange={(e) => setScaleCount(Math.max(1, Number(e.target.value) || 1))}
                className="w-16 rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              />
              <span className="text-sm text-zinc-500 dark:text-zinc-400">人分</span>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-600">
                  <th className="py-2 text-left font-medium text-zinc-700 dark:text-zinc-300">
                    食材
                  </th>
                  <th className="py-2 text-right font-medium text-zinc-700 dark:text-zinc-300">
                    量
                  </th>
                  <th className="py-2 text-left font-medium text-zinc-700 dark:text-zinc-300">
                    単位
                  </th>
                </tr>
              </thead>
              <tbody>
                {recipe.recipe_ingredients.map((ri) => {
                  const baseAmount = Number(ri.amount);
                  const servings = Math.max(1, recipe.servings);
                  const scaled = scaleCount !== servings ? (baseAmount * scaleCount) / servings : baseAmount;
                  const displayAmount = scaleCount !== servings
                    ? (Number.isInteger(scaled) ? scaled : Math.round(scaled * 10) / 10)
                    : ri.amount;
                  return (
                  <tr
                    key={ri.id}
                    className="border-b border-zinc-100 dark:border-zinc-700"
                  >
                    <td className="py-2 text-zinc-900 dark:text-zinc-100">
                      {ri.ingredient?.name ?? "—"}
                    </td>
                    <td className="py-2 text-right text-zinc-600 dark:text-zinc-400">
                      {displayAmount}
                    </td>
                    <td className="py-2 text-zinc-600 dark:text-zinc-400">
                      {ri.unit}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {recipe.cutting_notes?.trim() && (
          <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800/50 print:border print:shadow-none">
            <h3 className="mb-2 font-semibold text-zinc-900 dark:text-zinc-50 print:text-sm">
              切り方・大きさの目安
            </h3>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
              {recipe.cutting_notes.trim()}
            </p>
          </div>
        )}

        {recipe.description?.trim() && (
          <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800/50 print:border print:shadow-none">
            <h3 className="mb-2 font-semibold text-zinc-900 dark:text-zinc-50 print:text-sm">
              作り方・手順
            </h3>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
              {recipe.description.trim()}
            </p>
          </div>
        )}

        {recipe.source_url?.trim() && (
          <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800/50 print:border print:shadow-none">
            <h3 className="mb-2 font-semibold text-zinc-900 dark:text-zinc-50 print:text-sm">
              参考URL
            </h3>
            <a
              href={recipe.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="break-all text-sm text-primary underline hover:no-underline"
            >
              {recipe.source_url}
            </a>
          </div>
        )}
      </section>
    </div>
  );
}
