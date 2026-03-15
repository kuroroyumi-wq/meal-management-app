"use client";

import { useEffect, useState } from "react";
import { Package } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { DeleteConfirmModal } from "@/components/delete-confirm-modal";
import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Toast } from "@/components/ui/toast";
import type { Ingredient } from "@/types";

export default function IngredientsPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
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
    setSubmitting(true);

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
      setSuccessMessage(editingId ? "更新しました。" : "登録しました。");
      setError(null);
      await fetchIngredients();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/ingredients/${deleteTargetId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("削除に失敗しました");
      await fetchIngredients();
      if (editingId === deleteTargetId) resetForm();
      setDeleteTargetId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setDeleteLoading(false);
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
        <div className="mb-4">
          <Alert variant="error">{error}</Alert>
        </div>
      )}
      <Toast
        message={successMessage ?? ""}
        visible={!!successMessage}
        onDismiss={() => setSuccessMessage(null)}
        durationMs={4000}
      />

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-800/80"
        >
          <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            {editingId ? "編集" : "新規登録"}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label
                htmlFor="ing-name"
                className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                食材名 <span className="text-red-600 dark:text-red-400">必須</span>
              </label>
              <input
                id="ing-name"
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                required
                aria-required="true"
              />
            </div>
            <div>
              <label
                htmlFor="ing-unit"
                className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                単位 <span className="text-red-600 dark:text-red-400">必須</span>
              </label>
              <input
                id="ing-unit"
                type="text"
                value={form.unit}
                onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                placeholder="g, 個, 本"
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                required
                aria-required="true"
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
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
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
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
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
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
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
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
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
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
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
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button type="button" variant="outline" onClick={resetForm}>
              キャンセル
            </Button>
            <Button type="submit" className="ml-auto" disabled={submitting}>
              {submitting ? "保存中..." : editingId ? "更新" : "登録"}
            </Button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      ) : ingredients.length === 0 ? (
        <EmptyState
          icon={Package}
          title="食材がまだ登録されていません"
          description="食材を登録すると、レシピや献立で使えるようになります"
          ctaLabel="最初の食材を追加する"
          ctaOnClick={() => {
            resetForm();
            setShowForm(true);
          }}
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
          <table className="w-full min-w-[500px] text-left text-base">
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
                <th className="w-36 px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
              {ingredients.map((row) => (
                <tr
                  key={row.id}
                  className="bg-white transition-colors hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800/80"
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
                        className="min-h-10 min-w-10"
                        onClick={() => handleEdit(row)}
                      >
                        編集
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="min-h-10 min-w-10"
                        onClick={() => setDeleteTargetId(row.id)}
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

      <DeleteConfirmModal
        open={deleteTargetId !== null}
        title="食材を削除"
        message="この食材を削除しますか？この操作は取り消せません。"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTargetId(null)}
        loading={deleteLoading}
      />
    </div>
  );
}
