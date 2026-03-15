"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
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
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-zinc-500 dark:text-zinc-400">読み込み中...</p>
      ) : menus.length === 0 ? (
        <p className="rounded-lg border border-dashed border-zinc-300 py-8 text-center text-zinc-500 dark:border-zinc-600 dark:text-zinc-400">
          献立がありません。「新規作成」から追加してください。
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
          <table className="w-full min-w-[400px] text-left text-sm">
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
                <th className="w-24 px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
              {menus.map((row) => (
                <tr key={row.id} className="bg-white dark:bg-zinc-900">
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
                        buttonVariants({ variant: "outline", size: "sm" })
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
