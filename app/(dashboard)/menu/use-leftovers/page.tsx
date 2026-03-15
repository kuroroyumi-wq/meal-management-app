"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { GeneratedMenuJson } from "@/lib/claude";

type Recipe = { id: string; name: string; servings?: number };

const DAY_LABELS = ["月", "火", "水", "木", "金", "土", "日"];

function patternSummary(pattern: GeneratedMenuJson): string {
  const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  const parts = days.slice(0, 2).map((d, i) => {
    const day = (pattern as Record<string, { breakfast?: string; lunch?: string; dinner?: string }>)[d];
    if (!day) return "";
    return `${DAY_LABELS[i]}: ${[day.breakfast, day.lunch, day.dinner].filter(Boolean).join("・")}`;
  });
  return parts.filter(Boolean).join(" / ") + " …";
}

export default function UseLeftoversPage() {
  const router = useRouter();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [patterns, setPatterns] = useState<GeneratedMenuJson[] | null>(null);
  const [generating, setGenerating] = useState(false);
  const [applyIndex, setApplyIndex] = useState<number | null>(null);
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date();
    const mon = new Date(d);
    mon.setDate(d.getDate() - d.getDay() + (d.getDay() === 0 ? -6 : 1));
    return mon.toISOString().slice(0, 10);
  });
  const [headcount, setHeadcount] = useState(10);

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
        body: JSON.stringify({ week_start: weekStart, headcount }),
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

  const handleGenerate10 = async () => {
    setGenerating(true);
    setError(null);
    setPatterns(null);
    try {
      const res = await fetch("/api/menu/generate-leftovers-10", {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "10パターンの生成に失敗しました");
      setPatterns(data.patterns ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setGenerating(false);
    }
  };

  const handleApplyPattern = async (index: number) => {
    const pattern = patterns?.[index];
    if (!pattern) return;
    setApplyIndex(index);
    setError(null);
    try {
      const res = await fetch("/api/menu/apply-pattern", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pattern,
          week_start: weekStart,
          headcount,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "献立の採用に失敗しました");
      if (data.id) {
        router.push(`/menu/${data.id}`);
        router.refresh();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setApplyIndex(null);
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

      <p className="mb-6 text-base text-zinc-600 dark:text-zinc-400">
        現在の在庫から作れるレシピ一覧です。余った食材を活用して献立に取り入れられます。
      </p>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-base text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <Skeleton className="h-40 w-full rounded-xl" />
      ) : recipes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 py-12 text-center dark:border-zinc-600">
          <p className="text-zinc-600 dark:text-zinc-400">
            在庫から作れるレシピがありません。
          </p>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-500">
            在庫管理で仕入れを登録するか、レシピの材料を在庫の単位（g など）に合わせてください。
          </p>
          <Link href="/inventory" className={cn(buttonVariants({ variant: "outline" }), "mt-4 inline-block")}>
            在庫管理へ
          </Link>
        </div>
      ) : (
        <>
          {/* 10パターン生成 */}
          <section className="mb-8 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800/80">
            <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              10パターン生成（AI）
            </h2>
            <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
              在庫から作れるレシピで、1週間の献立を10パターン作成します。気に入った案を「この献立を使う」で採用できます。
            </p>
            <Button
              onClick={handleGenerate10}
              disabled={generating}
              className="min-h-11"
            >
              {generating ? "生成中..." : "10パターン生成"}
            </Button>

            {generating && (
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="h-28 rounded-lg" />
                ))}
              </div>
            )}

            {patterns && patterns.length > 0 && !generating && (
              <div className="mt-6">
                <p className="mb-4 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  週の開始日・人数を入力してから「この献立を使う」を押してください。
                </p>
                <div className="mb-4 flex flex-wrap items-center gap-4">
                  <div>
                    <label className="mb-1 block text-sm text-zinc-600 dark:text-zinc-400">週の開始日</label>
                    <input
                      type="date"
                      value={weekStart}
                      onChange={(e) => setWeekStart(e.target.value)}
                      className="rounded-md border border-zinc-300 px-3 py-2 text-base dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm text-zinc-600 dark:text-zinc-400">人数</label>
                    <input
                      type="number"
                      min={1}
                      value={headcount}
                      onChange={(e) => setHeadcount(Number(e.target.value) || 1)}
                      className="w-24 rounded-md border border-zinc-300 px-3 py-2 text-base dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {patterns.map((pat, index) => (
                    <div
                      key={index}
                      className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50"
                    >
                      <p className="mb-2 text-sm font-medium text-zinc-900 dark:text-zinc-50">
                        パターン {index + 1}
                      </p>
                      <p className="mb-3 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
                        {patternSummary(pat)}
                      </p>
                      <Button
                        size="sm"
                        className="w-full"
                        disabled={applyIndex !== null}
                        onClick={() => handleApplyPattern(index)}
                      >
                        {applyIndex === index ? "保存中..." : "この献立を使う"}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* 1週間献立を自動作成（既存） */}
          <div className="mb-6 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
            <h2 className="mb-3 font-semibold text-zinc-900 dark:text-zinc-50">
              余り食材で1週間献立を自動作成
            </h2>
            <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">
              作れるレシピを曜日・朝昼夕に割り当てた下書き献立を1件作成します。
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="date"
                value={weekStart}
                onChange={(e) => setWeekStart(e.target.value)}
                className="rounded-md border border-zinc-300 px-3 py-2 text-base dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
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
