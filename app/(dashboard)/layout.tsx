import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";
import { DashboardNav } from "@/components/dashboard-nav";

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
        <DashboardNav />
        <div className="mt-6 border-t border-zinc-200 pt-4 dark:border-zinc-700">
          <LogoutButton />
        </div>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
