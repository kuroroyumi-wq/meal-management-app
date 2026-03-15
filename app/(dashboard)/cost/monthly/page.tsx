"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { MonthlyCostSummary } from "@/types";

type LossData = {
  month: string;
  total_purchased: number;
  total_used: number;
  total_loss: number;
  loss_rate_percent: number;
  top5_loss_ingredients: { name: string; purchased: number; used: number; loss: number }[];
};

export default function CostMonthlyPage() {
  const [summary, setSummary] = useState<MonthlyCostSummary[]>([]);
  const [loss, setLoss] = useState<LossData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lossLoading, setLossLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

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

  useEffect(() => {
    if (!selectedMonth) return;
    let cancelled = false;
    setLossLoading(true);
    fetch(`/api/cost/monthly/loss?month=${selectedMonth}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data) setLoss(data);
        else if (!cancelled) setLoss(null);
      })
      .finally(() => {
        if (!cancelled) setLossLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedMonth]);

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
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-base text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
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
          <p className="mb-4 text-base text-zinc-700 dark:text-zinc-300">
            全期間 合計原価: <strong>¥{totalAll.toLocaleString()}</strong>
          </p>
          <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
            <table className="w-full min-w-[400px] text-left text-base">
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

          {/* 食材ロス集計 */}
          <section className="mt-10">
            <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              食材ロス集計
            </h2>
            <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
              仕入れ量 − 使用量でロスを算出しています。月を選んで確認できます。
            </p>
            <div className="mb-4">
              <label htmlFor="loss-month" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                対象月
              </label>
              <input
                id="loss-month"
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="rounded-md border border-zinc-300 px-3 py-2 text-base dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
            {lossLoading ? (
              <Skeleton className="h-32 w-full rounded-xl" />
            ) : loss ? (
              <div className="space-y-4 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800/80">
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                  <div>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">仕入れ総量</p>
                    <p className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                      {loss.total_purchased.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">使用総量</p>
                    <p className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                      {loss.total_used.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">食材ロス量</p>
                    <p className="text-xl font-bold text-red-600 dark:text-red-400">
                      {loss.total_loss.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">ロス率</p>
                    <p className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                      {loss.loss_rate_percent}%
                    </p>
                  </div>
                </div>
                {loss.top5_loss_ingredients.length > 0 && (
                  <div>
                    <h3 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      ロスが多い食材トップ5
                    </h3>
                    <ul className="space-y-2">
                      {loss.top5_loss_ingredients.map((ing, i) => (
                        <li
                          key={i}
                          className="flex items-center justify-between rounded-md bg-zinc-50 px-3 py-2 dark:bg-zinc-800"
                        >
                          <span className="font-medium text-zinc-900 dark:text-zinc-50">
                            {ing.name}
                          </span>
                          <span className="text-sm text-red-600 dark:text-red-400">
                            ロス {ing.loss.toLocaleString()}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {loss.total_purchased === 0 && loss.total_used === 0 && (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    この月の仕入れ・使用データがありません。
                  </p>
                )}
              </div>
            ) : null}
          </section>
        </>
      )}
    </div>
  );
}
