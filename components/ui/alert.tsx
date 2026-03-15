"use client";

import { cn } from "@/lib/utils";

type AlertVariant = "error" | "success" | "default";

const variantStyles: Record<AlertVariant, string> = {
  error:
    "bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-400 border-red-200 dark:border-red-800",
  success:
    "bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800",
  default:
    "bg-zinc-50 text-zinc-800 dark:bg-zinc-800/50 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700",
};

type AlertProps = {
  variant?: AlertVariant;
  children: React.ReactNode;
  className?: string;
};

export function Alert({
  variant = "default",
  children,
  className,
}: AlertProps) {
  return (
    <div
      role="alert"
      className={cn(
        "rounded-lg border px-4 py-3 text-base",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </div>
  );
}
