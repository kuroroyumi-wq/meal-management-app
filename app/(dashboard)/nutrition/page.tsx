"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Ingredient } from "@/types";
import type { Recipe } from "@/types";

type RecipeNutrition = {
  per_serving: { calories: number; protein: number; fat: number; carbs: number };
  servings: number;
};

export default function NutritionPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipeId, setSelectedRecipeId] = useState("");
  const [recipeNutrition, setRecipeNutrition] = useState<RecipeNutrition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [ingRes, recRes] = await Promise.all([
          fetch("/api/ingredients"),
          fetch("/api/recipes"),
        ]);
        if (!ingRes.ok) throw new Error("食材の取得に失敗しました");
        const ingData = await ingRes.json();
        setIngredients(Array.isArray(ingData) ? ingData : []);
        if (recRes.ok) {
          const recData = await recRes.json();
          setRecipes(Array.isArray(recData) ? recData : []);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (!selectedRecipeId) {
      setRecipeNutrition(null);
      return;
    }
    fetch(`/api/recipes/${selectedRecipeId}/nutrition`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setRecipeNutrition(data))
      .catch(() => setRecipeNutrition(null));
  }, [selectedRecipeId]);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        栄養管理
      </h1>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="mb-8 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
        <h2 className="mb-3 font-semibold text-zinc-900 dark:text-zinc-50">
          レシピ別 1人前の栄養素（目安）
        </h2>
        <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">
          レシピを選ぶと、材料の栄養データから1人前の栄養素を計算して表示します。食材に栄養情報（100gあたり）を登録すると計算されます。
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedRecipeId}
            onChange={(e) => setSelectedRecipeId(e.target.value)}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          >
            <option value="">レシピを選択</option>
            {recipes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
          {selectedRecipeId && (
            <Link
              href={`/recipes/${selectedRecipeId}`}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              レシピ詳細
            </Link>
          )}
        </div>
        {recipeNutrition && (
          <div className="mt-3 flex flex-wrap gap-4 rounded bg-white p-3 dark:bg-zinc-800">
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              熱量 {recipeNutrition.per_serving.calories} kcal
            </span>
            <span className="text-zinc-600 dark:text-zinc-400">
              タンパク質 {recipeNutrition.per_serving.protein} g
            </span>
            <span className="text-zinc-600 dark:text-zinc-400">
              脂質 {recipeNutrition.per_serving.fat} g
            </span>
            <span className="text-zinc-600 dark:text-zinc-400">
              炭水化物 {recipeNutrition.per_serving.carbs} g
            </span>
            <span className="text-zinc-500 dark:text-zinc-400 text-sm">
              （{recipeNutrition.servings}人前のレシピ）
            </span>
          </div>
        )}
      </div>

      <h2 className="mb-3 font-semibold text-zinc-900 dark:text-zinc-50">
        食材別 栄養成分（100gあたり）
      </h2>
      <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
        食材管理で登録・編集できます。栄養士が栄養情報を登録して活用してください。
      </p>

      {loading ? (
        <p className="text-zinc-500 dark:text-zinc-400">読み込み中...</p>
      ) : ingredients.length === 0 ? (
        <p className="rounded-lg border border-dashed border-zinc-300 py-8 text-center text-zinc-500 dark:border-zinc-600 dark:text-zinc-400">
          食材がありません。食材管理から登録してください。
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
          <table className="w-full min-w-[500px] text-left text-sm">
            <thead className="bg-zinc-100 dark:bg-zinc-800">
              <tr>
                <th className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                  食材名
                </th>
                <th className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                  熱量
                </th>
                <th className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                  タンパク質
                </th>
                <th className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                  脂質
                </th>
                <th className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                  炭水化物
                </th>
                <th className="w-24 px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
              {ingredients.map((row) => (
                <tr key={row.id} className="bg-white dark:bg-zinc-900">
                  <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                    {row.name}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {row.nutrition_per_100g?.calories != null
                      ? `${row.nutrition_per_100g.calories} kcal`
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {row.nutrition_per_100g?.protein != null
                      ? `${row.nutrition_per_100g.protein} g`
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {row.nutrition_per_100g?.fat != null
                      ? `${row.nutrition_per_100g.fat} g`
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {row.nutrition_per_100g?.carbs != null
                      ? `${row.nutrition_per_100g.carbs} g`
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href="/ingredients"
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" })
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
