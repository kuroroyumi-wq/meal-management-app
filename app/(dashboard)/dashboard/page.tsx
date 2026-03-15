import Link from "next/link";

export default function DashboardPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        ダッシュボード
      </h1>
      <p className="mb-8 text-zinc-600 dark:text-zinc-400">
        高齢者施設向け食事管理アプリへようこそ。左のメニューから各機能へ移動できます。
      </p>
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
