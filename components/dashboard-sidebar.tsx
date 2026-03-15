"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Package,
  BookOpen,
  Calendar,
  Warehouse,
  DollarSign,
  Heart,
  Users,
  ShoppingBag,
  Menu,
  X,
} from "lucide-react";
import { LogoutButton } from "@/components/logout-button";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "ダッシュボード", icon: LayoutDashboard },
  { href: "/ingredients", label: "食材管理", icon: Package },
  { href: "/recipes", label: "レシピ", icon: BookOpen },
  { href: "/menu", label: "週間献立", icon: Calendar },
  { href: "/inventory", label: "在庫管理", icon: Warehouse },
  { href: "/cost", label: "原価管理", icon: DollarSign },
  { href: "/nutrition", label: "栄養管理", icon: Heart },
  { href: "/staff", label: "スタッフ", icon: Users },
  { href: "/sales", label: "販売管理", icon: ShoppingBag },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const nav = (
    <nav className="flex flex-col gap-1">
      {navItems.map(({ href, label, icon: Icon }) => {
        const isActive =
          pathname === href ||
          (href !== "/dashboard" && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex min-h-[44px] items-center gap-3 rounded-md px-3 py-2.5 text-base font-medium transition-colors",
              "border-l-4 border-transparent md:justify-center md:px-2 lg:justify-start lg:px-3",
              isActive
                ? "border-primary bg-primary text-primary-foreground shadow-sm dark:border-primary dark:bg-primary dark:text-primary-foreground"
                : "text-zinc-700 hover:bg-zinc-200 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
            )}
            title={label}
          >
            <Icon
              className={cn(
                "size-5 shrink-0",
                isActive ? "text-primary-foreground" : "text-current"
              )}
              aria-hidden
            />
            <span className="hidden lg:inline">{label}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* スマホ: ハンバーガーボタン */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-40 flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-zinc-200 bg-white shadow md:hidden dark:border-zinc-700 dark:bg-zinc-800"
        aria-label="メニューを開く"
      >
        <Menu className="size-6 text-zinc-700 dark:text-zinc-300" />
      </button>

      {/* オーバーレイ（スマホでメニュー開時） */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}

      {/* サイドバー: スマホ=ドロワー, タブレット=アイコンのみ, PC=フル */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 flex h-full shrink-0 flex-col border-r border-zinc-200 bg-zinc-50 p-4 transition-[width,transform] dark:border-zinc-800 dark:bg-zinc-900 md:relative md:translate-x-0 md:w-16 md:p-2 lg:w-56 lg:p-4",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* アプリ名・ロゴ（タブレットではアイコンのみ） */}
        <div className="flex items-center justify-between md:justify-center lg:justify-between">
          <Link
            href="/dashboard"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50 md:gap-0"
            title="食事管理"
          >
            <span className="text-2xl md:text-xl" aria-hidden>
              🍱
            </span>
            <span className="hidden lg:inline">食事管理</span>
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-md md:hidden"
            aria-label="メニューを閉じる"
          >
            <X className="size-6 text-zinc-700 dark:text-zinc-300" />
          </button>
        </div>

        <div className="mt-6 flex-1 lg:mt-6">{nav}</div>

        <div className="border-t border-zinc-200 pt-4 dark:border-zinc-700 md:pt-3">
          <div className="hidden md:flex md:justify-center lg:hidden">
            <LogoutButton iconOnly />
          </div>
          <div className="block md:hidden lg:block">
            <LogoutButton />
          </div>
        </div>
      </aside>
    </>
  );
}
