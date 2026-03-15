"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { WeeklyMenu } from "@/types";

function formatWeekStart(s: string) {
  const d = new Date(s);
  return isNaN(d.getTime())
    ? s
    : `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日〜`;
}

export default function MenuPage() {
  const [menus, setMenus] = useState<WeeklyMenu[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMenus() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/menu");
        if (!res.ok) throw new Error("一覧の取得に失敗しました");
        const data = await res.json();
        setMenus(Array.isArray(data) ? data : []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
        setMenus([]);
      } finally {
        setLoading(false);
      }
    }
    fetchMenus();
  }, []);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          週間献立
        </h1>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/menu/use-leftovers"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            余り食材で献立
          </Link>
          <Link
            href="/menu/generate"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            AI生成
          </Link>
          <Link href="/menu/new" className={cn(buttonVariants())}>
            新規作成
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-4">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      ) : menus.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="献立がまだ登録されていません"
          description="献立を作成すると、今日の献立や原価計算に反映されます"
          ctaLabel="最初の献立を作成する"
          ctaHref="/menu/new"
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
          <table className="w-full min-w-[400px] text-left text-base">
            <thead className="bg-zinc-100 dark:bg-zinc-800">
              <tr>
                <th className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                  週
                </th>
                <th className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                  人数
                </th>
                <th className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                  状態
                </th>
                <th className="w-28 px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
              {menus.map((row) => (
                <tr
                  key={row.id}
                  className="bg-white transition-colors hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800/80"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/menu/${row.id}`}
                      className="font-medium text-zinc-900 underline hover:text-zinc-600 dark:text-zinc-100 dark:hover:text-zinc-300"
                    >
                      {formatWeekStart(row.week_start)}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {row.headcount}名
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {row.status === "confirmed" ? "確定" : "下書き"}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/menu/${row.id}`}
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                        "inline-flex min-h-10 min-w-10"
                      )}
                    >
                      詳細
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
