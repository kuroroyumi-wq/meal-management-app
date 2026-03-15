"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  /** メッセージ（従来の単一文） */
  message?: string;
  /** アイコン（lucide-react） */
  icon?: LucideIcon;
  /** タイトル（アイコン・CTA を使う場合はこちらを推奨） */
  title?: string;
  /** サブテキスト */
  description?: string;
  /** CTA ボタンラベル（指定時のみボタン表示） */
  ctaLabel?: string;
  /** CTA リンク先 */
  ctaHref?: string;
  /** CTA クリックハンドラ（ctaHref の代わりに使用可） */
  ctaOnClick?: () => void;
  className?: string;
};

export function EmptyState({
  message,
  icon: Icon,
  title,
  description,
  ctaLabel,
  ctaHref,
  ctaOnClick,
  className,
}: EmptyStateProps) {
  const hasCta = ctaLabel && (ctaHref || ctaOnClick);
  const displayTitle = title ?? message;
  const displayDesc = description ?? (title ? message : undefined);

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 py-12 px-6 text-center dark:border-zinc-600",
        className
      )}
    >
      {Icon && (
        <div className="mb-4 rounded-full bg-zinc-100 p-4 dark:bg-zinc-800">
          <Icon className="size-10 text-zinc-400 dark:text-zinc-500" aria-hidden />
        </div>
      )}
      {displayTitle && (
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          {displayTitle}
        </h3>
      )}
      {displayDesc && (
        <p className="mt-2 max-w-sm text-base text-zinc-600 dark:text-zinc-400">
          {displayDesc}
        </p>
      )}
      {!displayTitle && message && !Icon && (
        <p className="text-base text-zinc-700 dark:text-zinc-300">{message}</p>
      )}
      {hasCta && (
        <div className="mt-6">
          {ctaHref ? (
            <Link
              href={ctaHref}
              className={cn(buttonVariants({ variant: "default" }), "min-h-11")}
            >
              {ctaLabel}
            </Link>
          ) : (
            <Button className="min-h-11" onClick={ctaOnClick}>
              {ctaLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
