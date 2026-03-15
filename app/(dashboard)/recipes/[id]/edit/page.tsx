"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Ingredient } from "@/types";

const MEAL_TYPES = ["朝食", "昼食", "夕食"];

type IngredientRow = { ingredient_id: string; amount: string; unit: string };

export default function RecipeEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    servings: "1",
    meal_type: "",
    source_url: "",
  });
  const [rows, setRows] = useState<IngredientRow[]>([
    { ingredient_id: "", amount: "", unit: "" },
  ]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [recipesRes, ingredientsRes] = await Promise.all([
          fetch(`/api/recipes/${id}`),
          fetch("/api/ingredients"),
        ]);
        if (!recipesRes.ok) {
          if (recipesRes.status === 404) throw new Error("レシピが見つかりません");
          throw new Error("取得に失敗しました");
        }
        const recipe = await recipesRes.json();
        setForm({
          name: recipe.name ?? "",
          description: recipe.description ?? "",
          servings: String(recipe.servings ?? 1),
          meal_type: recipe.meal_type ?? "",
          source_url: recipe.source_url ?? "",
        });
        if (recipe.recipe_ingredients?.length) {
          setRows(
            recipe.recipe_ingredients.map(
              (ri: { ingredient_id: string; amount: number; unit: string }) => ({
                ingredient_id: ri.ingredient_id,
                amount: String(ri.amount),
                unit: ri.unit ?? "",
              })
            )
          );
        }
        if (ingredientsRes.ok) {
          const ingData = await ingredientsRes.json();
          setIngredients(Array.isArray(ingData) ? ingData : []);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const addRow = () => {
    setRows((r) => [...r, { ingredient_id: "", amount: "", unit: "" }]);
  };

  const removeRow = (index: number) => {
    setRows((r) => (r.length <= 1 ? r : r.filter((_, i) => i !== index)));
  };

  const updateRow = (index: number, field: keyof IngredientRow, value: string) => {
    setRows((r) => {
      const next = [...r];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/recipes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim() || null,
          servings: Number(form.servings) || 1,
          meal_type: form.meal_type || null,
          source_url: form.source_url.trim() || null,
          recipe_ingredients: rows
            .filter((r) => r.ingredient_id && r.amount && r.unit)
            .map((r) => ({
              ingredient_id: r.ingredient_id,
              amount: Number(r.amount),
              unit: r.unit.trim(),
            })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "更新に失敗しました");
      router.push(`/recipes/${id}`);
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
          href={`/recipes/${id}`}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          ← 詳細
        </Link>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          レシピ編集
        </h1>
      </div>

      {error && (
        <div className="mb-4">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-800/80">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            基本情報
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                レシピ名 *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                説明
              </label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                rows={2}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                人数（人前）
              </label>
              <input
                type="number"
                min="1"
                value={form.servings}
                onChange={(e) =>
                  setForm((f) => ({ ...f, servings: e.target.value }))
                }
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                食事区分
              </label>
              <select
                value={form.meal_type}
                onChange={(e) =>
                  setForm((f) => ({ ...f, meal_type: e.target.value }))
                }
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              >
                <option value="">選択なし</option>
                {MEAL_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                レシピURL
              </label>
              <input
                type="url"
                value={form.source_url}
                onChange={(e) =>
                  setForm((f) => ({ ...f, source_url: e.target.value }))
                }
                placeholder="https://..."
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-800/80">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              材料
            </h2>
            <Button type="button" variant="outline" size="sm" onClick={addRow}>
              行を追加
            </Button>
          </div>
          <div className="space-y-2">
            {rows.map((row, index) => (
              <div
                key={index}
                className="flex flex-wrap items-end gap-2 sm:flex-nowrap"
              >
                <div className="min-w-0 flex-1">
                  <label className="mb-1 block text-xs text-zinc-500">
                    食材
                  </label>
                  <select
                    value={row.ingredient_id}
                    onChange={(e) =>
                      updateRow(index, "ingredient_id", e.target.value)
                    }
                    className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                  >
                    <option value="">選択</option>
                    {ingredients.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.name}（{i.unit}）
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-24">
                  <label className="mb-1 block text-xs text-zinc-500">量</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={row.amount}
                    onChange={(e) =>
                      updateRow(index, "amount", e.target.value)
                    }
                    className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>
                <div className="w-20">
                  <label className="mb-1 block text-xs text-zinc-500">単位</label>
                  <input
                    type="text"
                    value={row.unit}
                    onChange={(e) =>
                      updateRow(index, "unit", e.target.value)
                    }
                    placeholder="g"
                    className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeRow(index)}
                  className="shrink-0"
                >
                  削除
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href={`/recipes/${id}`}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            キャンセル
          </Link>
          <Button type="submit" className="ml-auto" disabled={submitting}>
            {submitting ? "更新中..." : "更新"}
          </Button>
        </div>
      </form>
    </div>
  );
}
