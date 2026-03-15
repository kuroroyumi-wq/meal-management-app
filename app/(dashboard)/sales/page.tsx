"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { SalesProduct, SalesRecordWithProduct } from "@/types";

export default function SalesPage() {
  const [products, setProducts] = useState<SalesProduct[]>([]);
  const [records, setRecords] = useState<SalesRecordWithProduct[]>([]);
  const [month, setMonth] = useState("");
  const [formProduct, setFormProduct] = useState({ name: "", product_type: "chilled" as "frozen" | "chilled", unit_price: "200" });
  const [formRecord, setFormRecord] = useState({ product_id: "", quantity: "1", sold_at: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFormRecord((f) => ({ ...f, sold_at: new Date().toISOString().slice(0, 10) }));
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/sales/products");
      if (!res.ok) throw new Error("商品一覧の取得に失敗しました");
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    }
  };

  const fetchRecords = async () => {
    try {
      const url = month ? `/api/sales/records?month=${month}` : "/api/sales/records";
      const res = await fetch(url);
      if (!res.ok) throw new Error("販売履歴の取得に失敗しました");
      const data = await res.json();
      setRecords(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchProducts(), fetchRecords()]).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [month]);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch("/api/sales/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formProduct.name.trim(),
          product_type: formProduct.product_type,
          unit_price: Number(formProduct.unit_price) || 0,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "登録に失敗しました");
      }
      setFormProduct({ name: "", product_type: "chilled", unit_price: "200" });
      await fetchProducts();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    }
  };

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRecord.product_id) return;
    setError(null);
    try {
      const res = await fetch("/api/sales/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: formRecord.product_id,
          quantity: Number(formRecord.quantity) || 1,
          sold_at: formRecord.sold_at || new Date().toISOString().slice(0, 10),
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "販売の記録に失敗しました");
      }
      setFormRecord((f) => ({ ...f, quantity: "1" }));
      await fetchRecords();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("この商品を削除しますか？")) return;
    try {
      const res = await fetch(`/api/sales/products/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("削除に失敗しました");
      await fetchProducts();
      await fetchRecords();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    }
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        販売管理
      </h1>
      <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
        フリーズドライ・チルド等の販売商品と販売履歴を管理します（主食200円・副菜100円目安）。
      </p>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          販売商品
        </h2>
        <form onSubmit={handleAddProduct} className="mb-4 flex flex-wrap items-end gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800/50">
          <input
            type="text"
            value={formProduct.name}
            onChange={(e) => setFormProduct((f) => ({ ...f, name: e.target.value }))}
            placeholder="商品名"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            required
          />
          <select
            value={formProduct.product_type}
            onChange={(e) => setFormProduct((f) => ({ ...f, product_type: e.target.value as "frozen" | "chilled" }))}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          >
            <option value="chilled">チルド</option>
            <option value="frozen">フリーズドライ</option>
          </select>
          <input
            type="number"
            min="0"
            value={formProduct.unit_price}
            onChange={(e) => setFormProduct((f) => ({ ...f, unit_price: e.target.value }))}
            placeholder="単価"
            className="w-24 rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          />
          <Button type="submit" size="sm">追加</Button>
        </form>
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
          <table className="w-full min-w-[300px] text-left text-sm">
            <thead className="bg-zinc-100 dark:bg-zinc-800">
              <tr>
                <th className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">商品名</th>
                <th className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">区分</th>
                <th className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">単価</th>
                <th className="w-20 px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
              {products.map((p) => (
                <tr key={p.id} className="bg-white dark:bg-zinc-900">
                  <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">{p.name}</td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{p.product_type === "frozen" ? "フリーズドライ" : "チルド"}</td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">¥{p.unit_price.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <Button variant="outline" size="sm" onClick={() => handleDeleteProduct(p.id)} className="text-red-600">削除</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          販売記録
        </h2>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">月で絞り込み:</span>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
        <form onSubmit={handleAddRecord} className="mb-4 flex flex-wrap items-end gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800/50">
          <select
            value={formRecord.product_id}
            onChange={(e) => setFormRecord((f) => ({ ...f, product_id: e.target.value }))}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            required
          >
            <option value="">商品を選択</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.name} (¥{p.unit_price})</option>
            ))}
          </select>
          <input
            type="number"
            min="1"
            value={formRecord.quantity}
            onChange={(e) => setFormRecord((f) => ({ ...f, quantity: e.target.value }))}
            className="w-20 rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          />
          <input
            type="date"
            value={formRecord.sold_at}
            onChange={(e) => setFormRecord((f) => ({ ...f, sold_at: e.target.value }))}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          />
          <Button type="submit" size="sm">記録</Button>
        </form>
        {loading ? (
          <p className="text-zinc-500 dark:text-zinc-400">読み込み中...</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
            <table className="w-full min-w-[300px] text-left text-sm">
              <thead className="bg-zinc-100 dark:bg-zinc-800">
                <tr>
                  <th className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">日付</th>
                  <th className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">商品</th>
                  <th className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">数量</th>
                  <th className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">金額</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                {records.map((r) => (
                  <tr key={r.id} className="bg-white dark:bg-zinc-900">
                    <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">{r.sold_at}</td>
                    <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">{(r as SalesRecordWithProduct).product?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{r.quantity}</td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      ¥{(((r as SalesRecordWithProduct).product?.unit_price ?? 0) * r.quantity).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
