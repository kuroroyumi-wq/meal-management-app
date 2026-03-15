"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Package, BookOpen, Calendar, ChevronRight } from "lucide-react";
import { DashboardCard } from "@/components/dashboard-card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type Stats = {
  ingredientsCount: number;
  recipesCount: number;
  menusCount: number;
  hasMenuThisWeek: boolean;
  monthlyCostTotal: number;
  todayMenu: { breakfast: string; lunch: string; dinner: string };
  recentIngredients: { id: string; name: string }[];
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setStats(data);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        ダッシュボード
      </h1>
      <p className="mb-8 text-base text-zinc-700 dark:text-zinc-300">
        高齢者施設向け食事管理アプリへようこそ。左のメニューから各機能へ移動できます。
      </p>

      {/* KPI 2×2 */}
      <section className="mb-10">
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
          概要
        </h2>
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DashboardCard href="/menu">
              <span className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                今週の献立
              </span>
              <p className="mt-1 text-2xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
                {stats.hasMenuThisWeek ? "あり" : "未作成"}
                {stats.hasMenuThisWeek && (
                  <span className="ml-2 rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
                    今週あり
                  </span>
                )}
              </p>
            </DashboardCard>
            <DashboardCard href="/ingredients">
              <span className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                登録食材
              </span>
              <p className="mt-1 text-2xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
                {stats.ingredientsCount}
                <span className="ml-1 text-base font-normal text-zinc-600 dark:text-zinc-400">
                  件
                </span>
              </p>
            </DashboardCard>
            <DashboardCard href="/recipes">
              <span className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                登録レシピ
              </span>
              <p className="mt-1 text-2xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
                {stats.recipesCount}
                <span className="ml-1 text-base font-normal text-zinc-600 dark:text-zinc-400">
                  件
                </span>
              </p>
            </DashboardCard>
            <DashboardCard href="/cost/monthly">
              <span className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                今月の原価合計
              </span>
              <p className="mt-1 text-2xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
                ¥{stats.monthlyCostTotal.toLocaleString()}
              </p>
            </DashboardCard>
          </div>
        ) : null}
      </section>

      {/* 今日の献立 */}
      {stats && (
        <section className="mb-10">
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
            今日の献立
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800/80">
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                朝食
              </p>
              <p className="mt-1 text-base font-medium text-zinc-900 dark:text-zinc-50">
                {stats.todayMenu.breakfast || "—"}
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800/80">
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                昼食
              </p>
              <p className="mt-1 text-base font-medium text-zinc-900 dark:text-zinc-50">
                {stats.todayMenu.lunch || "—"}
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800/80">
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                夕食
              </p>
              <p className="mt-1 text-base font-medium text-zinc-900 dark:text-zinc-50">
                {stats.todayMenu.dinner || "—"}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* 最近追加した食材 */}
      {stats && stats.recentIngredients.length > 0 && (
        <section className="mb-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
              最近追加した食材
            </h2>
            <Link
              href="/ingredients"
              className="text-sm font-medium text-primary hover:underline"
            >
              一覧へ
            </Link>
          </div>
          <ul className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800/80">
            {stats.recentIngredients.map((ing) => (
              <li
                key={ing.id}
                className="flex items-center justify-between border-b border-zinc-100 px-4 py-3 last:border-b-0 dark:border-zinc-700"
              >
                <span className="text-base text-zinc-900 dark:text-zinc-50">
                  {ing.name}
                </span>
                <Link
                  href="/ingredients"
                  className="text-zinc-500 hover:text-primary dark:text-zinc-400"
                  aria-label={`${ing.name}の詳細`}
                >
                  <ChevronRight className="size-5" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 機能カード（アイコン付き） */}
      <section>
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
          メニュー
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <DashboardCard href="/ingredients">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-primary/10 p-2 text-primary">
                <Package className="size-5" />
              </div>
              <div>
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
                  食材管理
                </h3>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  食材マスタの登録・編集
                </p>
              </div>
            </div>
          </DashboardCard>
          <DashboardCard href="/recipes">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-primary/10 p-2 text-primary">
                <BookOpen className="size-5" />
              </div>
              <div>
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
                  レシピ
                </h3>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  レシピ一覧・登録・材料
                </p>
              </div>
            </div>
          </DashboardCard>
          <DashboardCard href="/menu">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-primary/10 p-2 text-primary">
                <Calendar className="size-5" />
              </div>
              <div>
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
                  週間献立
                </h3>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  献立作成・AI生成
                </p>
              </div>
            </div>
          </DashboardCard>
        </div>
      </section>
    </div>
  );
}
