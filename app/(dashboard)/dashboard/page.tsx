"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Stats = {
  ingredientsCount: number;
  recipesCount: number;
  menusCount: number;
  hasMenuThisWeek: boolean;
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
      <h1 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        ダッシュボード
      </h1>
      <p className="mb-6 text-zinc-600 dark:text-zinc-400">
        高齢者施設向け食事管理アプリへようこそ。左のメニューから各機能へ移動できます。
      </p>

      {!loading && stats && (
        <div className="mb-8 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800/50">
            <span className="text-sm text-zinc-500 dark:text-zinc-400">登録食材</span>
            <p className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              {stats.ingredientsCount}
              <span className="ml-1 text-sm font-normal text-zinc-500">件</span>
            </p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800/50">
            <span className="text-sm text-zinc-500 dark:text-zinc-400">登録レシピ</span>
            <p className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              {stats.recipesCount}
              <span className="ml-1 text-sm font-normal text-zinc-500">件</span>
            </p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800/50">
            <span className="text-sm text-zinc-500 dark:text-zinc-400">週間献立</span>
            <p className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              {stats.menusCount}
              <span className="ml-1 text-sm font-normal text-zinc-500">件</span>
              {stats.hasMenuThisWeek && (
                <span className="ml-2 text-xs text-green-600 dark:text-green-400">
                  今週あり
                </span>
              )}
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/ingredients"
          className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-zinc-300 hover:shadow dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-zinc-600"
        >
          <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">
            食材管理
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            食材マスタの登録・編集
          </p>
        </Link>
        <Link
          href="/recipes"
          className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-zinc-300 hover:shadow dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-zinc-600"
        >
          <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">
            レシピ
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            レシピ一覧・登録・材料
          </p>
        </Link>
        <Link
          href="/menu"
          className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-zinc-300 hover:shadow dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-zinc-600"
        >
          <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">
            週間献立
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            献立作成・AI生成
          </p>
        </Link>
      </div>
    </div>
  );
}
