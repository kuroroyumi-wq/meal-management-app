"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { InventoryWithIngredient } from "@/types";
import type { Ingredient } from "@/types";

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryWithIngredient[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    ingredient_id: "",
    quantity: "",
    unit_price: "",
    purchased_at: new Date().toISOString().slice(0, 10),
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [invRes, ingRes] = await Promise.all([
        fetch("/api/inventory"),
        fetch("/api/ingredients"),
      ]);
      if (!invRes.ok) throw new Error("在庫の取得に失敗しました");
      const invData = await invRes.json();
      setInventory(Array.isArray(invData) ? invData : []);
      if (ingRes.ok) {
        const ingData = await ingRes.json();
        setIngredients(Array.isArray(ingData) ? ingData : []);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      setInventory([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.ingredient_id || !form.quantity || Number(form.quantity) <= 0) {
      setError("食材と数量を入力してください。");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ingredient_id: form.ingredient_id,
          quantity: Number(form.quantity),
          unit_price:
            form.unit_price !== "" ? Number(form.unit_price) : null,
          purchased_at: form.purchased_at || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "仕入れの登録に失敗しました");
      setForm({
        ingredient_id: "",
        quantity: "",
        unit_price: "",
        purchased_at: new Date().toISOString().slice(0, 10),
      });
      await fetchData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        在庫管理
      </h1>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="mb-8 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
        <h2 className="mb-3 font-semibold text-zinc-900 dark:text-zinc-50">
          仕入れ登録
        </h2>
        <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              食材 *
            </label>
            <select
              value={form.ingredient_id}
              onChange={(e) =>
                setForm((f) => ({ ...f, ingredient_id: e.target.value }))
              }
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              required
            >
              <option value="">選択</option>
              {ingredients.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}（{i.unit}）
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              数量 *
            </label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={form.quantity}
              onChange={(e) =>
                setForm((f) => ({ ...f, quantity: e.target.value }))
              }
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
              仕入れ日
            </label>
            <input
              type="date"
              value={form.purchased_at}
              onChange={(e) =>
                setForm((f) => ({ ...f, purchased_at: e.target.value }))
              }
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
          <div className="flex items-end">
            <Button type="submit" disabled={submitting}>
              {submitting ? "登録中..." : "登録"}
            </Button>
          </div>
        </form>
      </div>

      <h2 className="mb-3 font-semibold text-zinc-900 dark:text-zinc-50">
        在庫一覧
      </h2>

      {loading ? (
        <p className="text-zinc-500 dark:text-zinc-400">読み込み中...</p>
      ) : inventory.length === 0 ? (
        <p className="rounded-lg border border-dashed border-zinc-300 py-8 text-center text-zinc-500 dark:border-zinc-600 dark:text-zinc-400">
          在庫がありません。仕入れを登録するとここに表示されます。
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
          <table className="w-full min-w-[400px] text-left text-sm">
            <thead className="bg-zinc-100 dark:bg-zinc-800">
              <tr>
                <th className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                  食材
                </th>
                <th className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                  単位
                </th>
                <th className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                  在庫数
                </th>
                <th className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                  更新日時
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
              {inventory.map((row) => (
                <tr key={row.id} className="bg-white dark:bg-zinc-900">
                  <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                    {row.ingredient?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {row.ingredient?.unit ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {Number(row.quantity).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400 text-xs">
                    {row.updated_at
                      ? new Date(row.updated_at).toLocaleString("ja-JP")
                      : "—"}
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
