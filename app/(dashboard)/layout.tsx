import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";

const navItems = [
  { href: "/dashboard", label: "ダッシュボード" },
  { href: "/ingredients", label: "食材管理" },
  { href: "/recipes", label: "レシピ" },
  { href: "/menu", label: "週間献立" },
  { href: "/inventory", label: "在庫管理" },
  { href: "/cost", label: "原価管理" },
  { href: "/nutrition", label: "栄養管理" },
  { href: "/staff", label: "スタッフ" },
  { href: "/sales", label: "販売管理" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-56 shrink-0 border-r border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <Link
          href="/dashboard"
          className="mb-6 block text-lg font-semibold text-zinc-900 dark:text-zinc-50"
        >
          食事管理
        </Link>
        <nav className="flex flex-col gap-1">
          {navItems.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="rounded-md px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="mt-6 border-t border-zinc-200 pt-4 dark:border-zinc-700">
          <LogoutButton />
        </div>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
