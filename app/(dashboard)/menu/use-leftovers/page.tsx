"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Recipe = { id: string; name: string; servings?: number };

export default function UseLeftoversPage() {
  const router = useRouter();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date();
    const mon = new Date(d);
    mon.setDate(d.getDate() - d.getDay() + (d.getDay() === 0 ? -6 : 1));
    return mon.toISOString().slice(0, 10);
  });

  useEffect(() => {
    async function fetchSuggested() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/recipes/suggest-from-inventory");
        if (!res.ok) throw new Error("取得に失敗しました");
        const data = await res.json();
        setRecipes(data.recipes ?? []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
        setRecipes([]);
      } finally {
        setLoading(false);
      }
    }
    fetchSuggested();
  }, []);

  const handleCreateWeekly = async () => {
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/menu/from-leftovers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ week_start: weekStart, headcount: 1 }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "献立の作成に失敗しました");
      if (data.id) {
        router.push(`/menu/${data.id}`);
        router.refresh();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          余り食材で作れる献立
        </h1>
        <Link
          href="/menu"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          献立一覧へ
        </Link>
      </div>

      <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
        現在の在庫から作れるレシピ一覧です。余った食材を活用して献立に取り入れられます。
      </p>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-zinc-500 dark:text-zinc-400">読み込み中...</p>
      ) : recipes.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 py-12 text-center dark:border-zinc-600">
          <p className="text-zinc-600 dark:text-zinc-400">
            在庫から作れるレシピがありません。
          </p>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-500">
            在庫管理で仕入れを登録するか、レシピの材料を在庫の単位（g など）に合わせてください。
          </p>
          <Link href="/inventory" className={cn(buttonVariants({ variant: "outline" }), "mt-4")}>
            在庫管理へ
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-6 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
            <h2 className="mb-3 font-semibold text-zinc-900 dark:text-zinc-50">
              余り食材で1週間献立を自動作成
            </h2>
            <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">
              上記レシピを曜日・朝昼夕に割り当てた下書き献立を1件作成します。
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="date"
                value={weekStart}
                onChange={(e) => setWeekStart(e.target.value)}
                className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              />
              <Button onClick={handleCreateWeekly} disabled={creating}>
                {creating ? "作成中..." : "1週間献立を作成"}
              </Button>
            </div>
          </div>

          <h2 className="mb-3 font-semibold text-zinc-900 dark:text-zinc-50">
            作れるレシピ（{recipes.length}件）
          </h2>
          <ul className="space-y-2">
            {recipes.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/recipes/${r.id}`}
                  className={cn(
                    buttonVariants({ variant: "ghost" }),
                    "w-full justify-start font-normal"
                  )}
                >
                  {r.name}
                  {r.servings != null && (
                    <span className="ml-2 text-zinc-500">（{r.servings}人前）</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
