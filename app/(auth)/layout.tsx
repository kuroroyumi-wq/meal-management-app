export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-100 dark:bg-zinc-900">
      <div className="w-full max-w-sm px-4">{children}</div>
    </div>
  );
}
