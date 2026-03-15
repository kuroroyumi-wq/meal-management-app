"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { MonthlyCostSummary } from "@/types";

export default function CostMonthlyPage() {
  const [summary, setSummary] = useState<MonthlyCostSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSummary() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/cost/monthly");
        if (!res.ok) throw new Error("月次統計の取得に失敗しました");
        const data = await res.json();
        setSummary(Array.isArray(data) ? data : []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
        setSummary([]);
      } finally {
        setLoading(false);
      }
    }
    fetchSummary();
  }, []);

  const totalAll = summary.reduce((s, m) => s + m.total_cost, 0);

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Link
          href="/cost"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          ← 原価一覧
        </Link>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          月次統計
        </h1>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
        仕入れ原価と食事提供売上（朝200円・昼500円・夕500円×提供数）の月別集計です。
      </p>

      {loading ? (
        <p className="text-zinc-500 dark:text-zinc-400">読み込み中...</p>
      ) : summary.length === 0 ? (
        <p className="rounded-lg border border-dashed border-zinc-300 py-8 text-center text-zinc-500 dark:border-zinc-600 dark:text-zinc-400">
          データがありません。仕入れを登録すると月次集計に反映されます。
        </p>
      ) : (
        <>
          <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
            全期間 合計原価: <strong>¥{totalAll.toLocaleString()}</strong>
          </p>
          <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
            <table className="w-full min-w-[400px] text-left text-sm">
              <thead className="bg-zinc-100 dark:bg-zinc-800">
                <tr>
                  <th className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">月</th>
                  <th className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">仕入れ回数</th>
                  <th className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">原価合計</th>
                  <th className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">売上（食事提供）</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                {summary.map((row) => (
                  <tr key={row.month} className="bg-white dark:bg-zinc-900">
                    <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">{row.month}</td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{row.purchase_count}回</td>
                    <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                      ¥{row.total_cost.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                      ¥{(row.revenue ?? 0).toLocaleString()}
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
