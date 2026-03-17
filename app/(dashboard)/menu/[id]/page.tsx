"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { WeeklyMenuWithItems } from "@/types";

const DISH_ROLES = [
  { value: "staple", label: "主食", order: 0 },
  { value: "main", label: "主菜", order: 1 },
  { value: "side", label: "副菜", order: 2 },
  { value: "soup", label: "汁物", order: 3 },
  { value: "dessert", label: "デザート", order: 4 },
] as const;

function formatDate(s: string) {
  const d = new Date(s);
  return isNaN(d.getTime()) ? s : `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function MenuDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [menu, setMenu] = useState<WeeklyMenuWithItems | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    async function fetchMenu() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/menu/${id}`);
        if (!res.ok) {
          if (res.status === 404) throw new Error("献立が見つかりません");
          throw new Error("取得に失敗しました");
        }
        const data = await res.json();
        setMenu(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
        setMenu(null);
      } finally {
        setLoading(false);
      }
    }
    fetchMenu();
  }, [id]);

  const handleDelete = async () => {
    if (!confirm("この献立を削除しますか？")) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/menu/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("削除に失敗しました");
      router.push("/menu");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <p className="text-zinc-500 dark:text-zinc-400">読み込み中...</p>;
  }

  if (error || !menu) {
    return (
      <div>
        <p className="mb-4 text-red-600 dark:text-red-400">
          {error ?? "Not found"}
        </p>
        <Link href="/menu" className={cn(buttonVariants({ variant: "outline" }))}>
          一覧へ戻る
        </Link>
      </div>
    );
  }

  const items = menu.menu_items ?? [];
  const byDate = items.reduce<Record<string, typeof items>>((acc, item) => {
    if (!acc[item.date]) acc[item.date] = [];
    acc[item.date].push(item);
    return acc;
  }, {});
  const dates = Object.keys(byDate).sort();

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/menu"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            ← 一覧
          </Link>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            {menu.week_start} 〜 週間献立
          </h1>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/menu/${id}/edit`}
            className={cn(buttonVariants({ size: "sm" }))}
          >
            編集
          </Link>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? "削除中..." : "削除"}
          </Button>
        </div>
      </div>

      <div className="mb-6 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
        <dl className="flex flex-wrap gap-6">
          <div>
            <dt className="text-sm text-zinc-500 dark:text-zinc-400">人数</dt>
            <dd className="font-medium text-zinc-900 dark:text-zinc-100">
              {menu.headcount}名
            </dd>
          </div>
          <div>
            <dt className="text-sm text-zinc-500 dark:text-zinc-400">状態</dt>
            <dd className="font-medium text-zinc-900 dark:text-zinc-100">
              {menu.status === "confirmed" ? "確定" : "下書き"}
            </dd>
          </div>
        </dl>
      </div>

      {dates.length === 0 ? (
        <p className="text-zinc-500 dark:text-zinc-400">
          献立詳細がまだ登録されていません。編集から追加できます。
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
          <table className="w-full text-sm">
            <thead className="bg-zinc-100 dark:bg-zinc-800">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-zinc-900 dark:text-zinc-50">
                  日付
                </th>
                <th className="px-4 py-3 text-left font-medium text-zinc-900 dark:text-zinc-50">
                  朝食
                </th>
                <th className="px-4 py-3 text-left font-medium text-zinc-900 dark:text-zinc-50">
                  昼食
                </th>
                <th className="px-4 py-3 text-left font-medium text-zinc-900 dark:text-zinc-50">
                  夕食
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
              {dates.map((date) => {
                const dayItems = byDate[date];
                const byMeal = dayItems.reduce<Record<string, typeof dayItems>>(
                  (acc, i) => {
                    if (!acc[i.meal_type]) acc[i.meal_type] = [];
                    acc[i.meal_type].push(i);
                    return acc;
                  },
                  {}
                );

                function renderMeal(mealType: "朝食" | "昼食" | "夕食") {
                  const list = (byMeal[mealType] ?? [])
                    .slice()
                    .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));

                  if (list.length === 0) return <span>—</span>;

                  return (
                    <div className="space-y-1">
                      {DISH_ROLES.map((role) => {
                        const item = list.find((i) => i.dish_role === role.value);
                        const name = item?.recipe?.name ?? "—";
                        return (
                          <div key={role.value} className="flex gap-2">
                            <span className="w-16 shrink-0 text-xs text-zinc-500 dark:text-zinc-400">
                              {role.label}
                            </span>
                            <span className="text-zinc-700 dark:text-zinc-300">
                              {name}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  );
                }
                return (
                  <tr key={date} className="bg-white dark:bg-zinc-900">
                    <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                      {date} ({formatDate(date)})
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {renderMeal("朝食")}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {renderMeal("昼食")}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {renderMeal("夕食")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
