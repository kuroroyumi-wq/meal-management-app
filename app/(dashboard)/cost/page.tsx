"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PurchaseWithIngredient } from "@/types";

export default function CostPage() {
  const [purchases, setPurchases] = useState<PurchaseWithIngredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [month, setMonth] = useState("");

  const fetchPurchases = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = month
        ? `/api/cost?month=${encodeURIComponent(month)}`
        : "/api/cost";
      const res = await fetch(url);
      if (!res.ok) throw new Error("原価一覧の取得に失敗しました");
      const data = await res.json();
      setPurchases(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      setPurchases([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, [month]);

  const total = purchases.reduce((sum, p) => sum + (p.total ?? 0), 0);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          原価管理
        </h1>
        <Link
          href="/cost/monthly"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          月次統計
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="mb-4 flex items-center gap-2">
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          月で絞り込み:
        </label>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setMonth("")}
        >
          クリア
        </Button>
      </div>

      {loading ? (
        <p className="text-zinc-500 dark:text-zinc-400">読み込み中...</p>
      ) : purchases.length === 0 ? (
        <p className="rounded-lg border border-dashed border-zinc-300 py-8 text-center text-zinc-500 dark:border-zinc-600 dark:text-zinc-400">
          {month ? "該当月の仕入れがありません。" : "仕入れ履歴がありません。在庫管理で仕入れを登録するとここに表示されます。"}
        </p>
      ) : (
        <>
          <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">
            合計: <strong>¥{total.toLocaleString()}</strong>
            {month && `（${month}）`}
          </p>
          <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
            <table className="w-full min-w-[500px] text-left text-sm">
              <thead className="bg-zinc-100 dark:bg-zinc-800">
                <tr>
                  <th className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                    日付
                  </th>
                  <th className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                    食材
                  </th>
                  <th className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                    数量
                  </th>
                  <th className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                    単価
                  </th>
                  <th className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                    金額
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                {purchases.map((row) => (
                  <tr key={row.id} className="bg-white dark:bg-zinc-900">
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {row.purchased_at?.slice(0, 10) ?? "—"}
                    </td>
                    <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                      {row.ingredient?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {Number(row.quantity).toLocaleString()}
                      {row.ingredient?.unit ? ` ${row.ingredient.unit}` : ""}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      ¥{Number(row.unit_price).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                      ¥{(row.total ?? 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
