"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DeleteConfirmModalProps = {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
};

export function DeleteConfirmModal({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  loading = false,
}: DeleteConfirmModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
    >
      <div
        className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-700 dark:bg-zinc-800"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="delete-modal-title"
          className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
        >
          {title}
        </h2>
        <p className="mt-2 text-base text-zinc-600 dark:text-zinc-400">
          {message}
        </p>
        <div className="mt-6 flex gap-3">
          <Button
            variant="outline"
            className="min-h-11 flex-1"
            onClick={onCancel}
            disabled={loading}
          >
            キャンセル
          </Button>
          <Button
            variant="destructive"
            className="min-h-11 flex-1"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "削除中..." : "削除する"}
          </Button>
        </div>
      </div>
    </div>
  );
}
