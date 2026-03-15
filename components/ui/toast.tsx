"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";

type ToastProps = {
  message: string;
  visible: boolean;
  onDismiss: () => void;
  durationMs?: number;
  className?: string;
};

/**
 * 画面上部に表示する簡易トースト。durationMs 後に自動で onDismiss を呼ぶ。
 */
export function Toast({
  message,
  visible,
  onDismiss,
  durationMs = 4000,
  className,
}: ToastProps) {
  useEffect(() => {
    if (!visible || durationMs <= 0) return;
    const t = setTimeout(onDismiss, durationMs);
    return () => clearTimeout(t);
  }, [visible, durationMs, onDismiss]);

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "fixed right-4 top-4 z-50 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-base font-medium text-green-800 shadow-md dark:border-green-800 dark:bg-green-900/90 dark:text-green-100",
        className
      )}
    >
      {message}
    </div>
  );
}
