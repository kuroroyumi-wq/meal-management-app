"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * ダッシュボード用のカードコンポーネント。
 * href を渡すとリンクとして全体がクリック可能になり、hover 時の見た目が付きます。
 */
type DashboardCardProps = {
  /** 指定するとカード全体がこのURLへ遷移するリンクになる */
  href?: string;
  /** カード内の内容 */
  children: React.ReactNode;
  /** 追加のクラス名 */
  className?: string;
};

export function DashboardCard({
  href,
  children,
  className,
}: DashboardCardProps) {
  const baseStyles =
    "rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-all duration-200 " +
    "hover:border-zinc-300 hover:shadow-md hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 " +
    "dark:border-zinc-700 dark:bg-zinc-800/80 dark:hover:border-zinc-600 dark:hover:bg-zinc-800";

  if (href) {
    return (
      <Link
        href={href}
        className={cn(baseStyles, "block cursor-pointer min-h-[44px]", className)}
      >
        {children}
      </Link>
    );
  }

  return (
    <div className={cn(baseStyles, "cursor-default", className)}>
      {children}
    </div>
  );
}
