"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Ingredient } from "@/types";

const MEAL_TYPES = ["朝食", "昼食", "夕食"];

type IngredientRow = {
  ingredient_id: string;
  amount: string;
  unit: string;
  displayName?: string; // URL取り込み時に未マッチのとき表示用
};

export default function RecipeNewPage() {
  const router = useRouter();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    servings: "1",
    meal_type: "",
    source_url: "",
  });
  const [rows, setRows] = useState<IngredientRow[]>([
    { ingredient_id: "", amount: "", unit: "" },
  ]);
  const [mode, setMode] = useState<"normal" | "simple">("normal");
  const [scrapeUrl, setScrapeUrl] = useState("");
  const [scraping, setScraping] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function fetchIngredients() {
      try {
        const res = await fetch("/api/ingredients");
        if (!res.ok) return;
        const data = await res.json();
        setIngredients(Array.isArray(data) ? data : []);
      } finally {
        setLoading(false);
      }
    }
    fetchIngredients();
  }, []);

  const addRow = () => {
    setRows((r) => [...r, { ingredient_id: "", amount: "", unit: "" }]);
  };

  const handleScrape = async () => {
    if (!scrapeUrl.trim()) return;
    setScraping(true);
    setError(null);
    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: scrapeUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "取り込みに失敗しました");
      setForm((f) => ({
        ...f,
        name: data.title || f.name,
        source_url: data.source_url || f.source_url,
      }));
      const list = Array.isArray(data.ingredients) ? data.ingredients : [];
      const newRows: IngredientRow[] = list.map(
        (s: { name: string; amount: string; unit: string }) => {
          const matched = ingredients.find(
            (i) =>
              i.name === s.name ||
              i.name.includes(s.name) ||
              s.name.includes(i.name)
          );
          return {
            ingredient_id: matched?.id ?? "",
            amount: s.amount ?? "",
            unit: s.unit || "—",
            displayName: matched ? undefined : s.name,
          };
        }
      );
      setRows(newRows.length > 0 ? newRows : [{ ingredient_id: "", amount: "", unit: "" }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setScraping(false);
    }
  };

  const removeRow = (index: number) => {
    setRows((r) => (r.length <= 1 ? r : r.filter((_, i) => i !== index)));
  };

  const updateRow = (index: number, field: keyof IngredientRow, value: string) => {
    setRows((r) => {
      const next = [...r];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim() || null,
          servings: Number(form.servings) || 1,
          meal_type: form.meal_type || null,
          source_url: form.source_url.trim() || null,
          status: mode === "simple" ? "simple" : "draft",
          is_template: mode === "normal",
          recipe_ingredients: rows
            .filter((r) => r.ingredient_id && r.amount && r.unit)
            .map((r) => ({
              ingredient_id: r.ingredient_id,
              amount: Number(r.amount),
              unit: r.unit.trim(),
            })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "登録に失敗しました");
      router.push(`/recipes/${data.id}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <Link
          href="/recipes"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          ← 一覧
        </Link>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:flex-1">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              レシピ登録
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              現場の運用に合わせて、「通常登録」と「簡易登録」を選べます。
            </p>
          </div>
          <div className="inline-flex rounded-lg bg-zinc-100 p-1 text-sm dark:bg-zinc-800">
            <button
              type="button"
              onClick={() => setMode("normal")}
              className={cn(
                "rounded-md px-3 py-1.5",
                mode === "normal"
                  ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-zinc-50"
                  : "text-zinc-600 dark:text-zinc-300"
              )}
            >
              通常登録
            </button>
            <button
              type="button"
              onClick={() => setMode("simple")}
              className={cn(
                "rounded-md px-3 py-1.5",
                mode === "simple"
                  ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-zinc-50"
                  : "text-zinc-600 dark:text-zinc-300"
              )}
            >
              簡易登録
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      {mode === "normal" && (
        <div className="mb-6 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-800/80">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            URLから取り込む
          </h2>
          <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">
            レシピのURLを入力すると、タイトルと材料を自動で取り込みます（対応サイト: 構造化データまたは材料リストがあるページ）。
          </p>
          <div className="flex flex-wrap gap-2">
            <input
              type="url"
              value={scrapeUrl}
              onChange={(e) => setScrapeUrl(e.target.value)}
              placeholder="https://..."
              className="min-w-[240px] flex-1 rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleScrape}
              disabled={scraping}
            >
              {scraping ? "取り込み中..." : "取り込む"}
            </Button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-800/80">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            基本情報
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                レシピ名 *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                説明
              </label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                rows={2}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                人数（人前）
              </label>
              <input
                type="number"
                min="1"
                value={form.servings}
                onChange={(e) =>
                  setForm((f) => ({ ...f, servings: e.target.value }))
                }
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                食事区分
              </label>
              <select
                value={form.meal_type}
                onChange={(e) =>
                  setForm((f) => ({ ...f, meal_type: e.target.value }))
                }
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              >
                <option value="">選択なし</option>
                {MEAL_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                レシピURL
              </label>
              <input
                type="url"
                value={form.source_url}
                onChange={(e) =>
                  setForm((f) => ({ ...f, source_url: e.target.value }))
                }
                placeholder="https://..."
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-800/80">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              材料
            </h2>
            <Button type="button" variant="outline" size="sm" onClick={addRow}>
              行を追加
            </Button>
          </div>
          <p className="mb-3 text-xs text-zinc-600 dark:text-zinc-400">
            {mode === "simple"
              ? "よく使う食材だけ選んで、ざっくり量を入れてください。後から通常編集で細かく調整できます。"
              : "食材マスタから選択して、人数1人あたりの材料量を入力します。"}
          </p>
          <div className="space-y-2">
            {rows.map((row, index) => (
              <div
                key={index}
                className="flex flex-wrap items-end gap-2 sm:flex-nowrap"
              >
                <div className="min-w-0 flex-1">
                  <label className="mb-1 block text-xs text-zinc-500">
                    食材
                  </label>
                  <select
                    value={row.ingredient_id}
                    onChange={(e) =>
                      updateRow(index, "ingredient_id", e.target.value)
                    }
                    className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                  >
                    <option value="">
                      {row.displayName ? `（取り込んだ）${row.displayName}` : "選択"}
                    </option>
                    {ingredients.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.name}（{i.unit}）
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-24">
                  <label className="mb-1 block text-xs text-zinc-500">量</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={row.amount}
                    onChange={(e) =>
                      updateRow(index, "amount", e.target.value)
                    }
                    className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>
                <div className="w-20">
                  <label className="mb-1 block text-xs text-zinc-500">単位</label>
                  <input
                    type="text"
                    value={row.unit}
                    onChange={(e) =>
                      updateRow(index, "unit", e.target.value)
                    }
                    placeholder="g"
                    className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeRow(index)}
                  className="shrink-0"
                >
                  削除
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/recipes"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            キャンセル
          </Link>
          <Button type="submit" className="ml-auto" disabled={submitting}>
            {submitting ? "登録中..." : "登録"}
          </Button>
        </div>
      </form>
    </div>
  );
}
