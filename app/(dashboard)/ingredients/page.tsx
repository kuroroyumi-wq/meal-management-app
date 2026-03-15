"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { Ingredient } from "@/types";

export default function IngredientsPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    unit: "",
    unit_price: "",
    category: "",
    calories: "",
    protein: "",
    fat: "",
    carbs: "",
  });

  const fetchIngredients = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ingredients");
      if (!res.ok) throw new Error("一覧の取得に失敗しました");
      const data = await res.json();
      setIngredients(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      setIngredients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIngredients();
  }, []);

  const resetForm = () => {
    setForm({
      name: "",
      unit: "",
      unit_price: "",
      category: "",
      calories: "",
      protein: "",
      fat: "",
      carbs: "",
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (row: Ingredient) => {
    const n = row.nutrition_per_100g;
    setForm({
      name: row.name,
      unit: row.unit,
      unit_price: row.unit_price != null ? String(row.unit_price) : "",
      category: row.category ?? "",
      calories: n?.calories != null ? String(n.calories) : "",
      protein: n?.protein != null ? String(n.protein) : "",
      fat: n?.fat != null ? String(n.fat) : "",
      carbs: n?.carbs != null ? String(n.carbs) : "",
    });
    setEditingId(row.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.unit.trim()) return;

    const nutrition =
      form.calories || form.protein || form.fat || form.carbs
        ? {
            calories: form.calories !== "" ? Number(form.calories) : undefined,
            protein: form.protein !== "" ? Number(form.protein) : undefined,
            fat: form.fat !== "" ? Number(form.fat) : undefined,
            carbs: form.carbs !== "" ? Number(form.carbs) : undefined,
          }
        : null;
    const body = {
      name: form.name.trim(),
      unit: form.unit.trim(),
      unit_price: form.unit_price === "" ? null : Number(form.unit_price),
      category: form.category.trim() || null,
      nutrition_per_100g: nutrition,
    };

    try {
      if (editingId) {
        const res = await fetch(`/api/ingredients/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "更新に失敗しました");
        }
      } else {
        const res = await fetch("/api/ingredients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "登録に失敗しました");
        }
      }
      resetForm();
      await fetchIngredients();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("この食材を削除しますか？")) return;
    try {
      const res = await fetch(`/api/ingredients/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("削除に失敗しました");
      await fetchIngredients();
      if (editingId === id) resetForm();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          食材管理
        </h1>
        <Button
          variant="default"
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
        >
          {showForm ? "キャンセル" : "追加"}
        </Button>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50"
        >
          <h2 className="mb-3 font-semibold text-zinc-900 dark:text-zinc-50">
            {editingId ? "編集" : "新規登録"}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                食材名 *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                単位 *
              </label>
              <input
                type="text"
                value={form.unit}
                onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                placeholder="g, 個, 本"
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                単価（円）
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.unit_price}
                onChange={(e) =>
                  setForm((f) => ({ ...f, unit_price: e.target.value }))
                }
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                カテゴリ
              </label>
              <input
                type="text"
                value={form.category}
                onChange={(e) =>
                  setForm((f) => ({ ...f, category: e.target.value }))
                }
                placeholder="野菜, 肉類"
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                熱量（kcal/100g）
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={form.calories}
                onChange={(e) =>
                  setForm((f) => ({ ...f, calories: e.target.value }))
                }
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                タンパク質（g/100g）
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={form.protein}
                onChange={(e) =>
                  setForm((f) => ({ ...f, protein: e.target.value }))
                }
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                脂質（g/100g）
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={form.fat}
                onChange={(e) =>
                  setForm((f) => ({ ...f, fat: e.target.value }))
                }
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                炭水化物（g/100g）
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={form.carbs}
                onChange={(e) =>
                  setForm((f) => ({ ...f, carbs: e.target.value }))
                }
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <Button type="submit">{editingId ? "更新" : "登録"}</Button>
            <Button type="button" variant="outline" onClick={resetForm}>
              キャンセル
            </Button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-zinc-500 dark:text-zinc-400">読み込み中...</p>
      ) : ingredients.length === 0 ? (
        <p className="rounded-lg border border-dashed border-zinc-300 py-8 text-center text-zinc-500 dark:border-zinc-600 dark:text-zinc-400">
          食材がありません。「追加」から登録してください。
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
                  単位
                </th>
                <th className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                  単価
                </th>
                <th className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                  カテゴリ
                </th>
                <th className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                  栄養(100g)
                </th>
                <th className="w-32 px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
              {ingredients.map((row) => (
                <tr
                  key={row.id}
                  className="bg-white dark:bg-zinc-900"
                >
                  <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100">
                    {row.name}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {row.unit}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {row.unit_price != null
                      ? `¥${Number(row.unit_price).toLocaleString()}`
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {row.category ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400 text-xs">
                    {row.nutrition_per_100g?.calories != null
                      ? `${row.nutrition_per_100g.calories}kcal`
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(row)}
                      >
                        編集
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(row.id)}
                      >
                        削除
                      </Button>
                    </div>
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
