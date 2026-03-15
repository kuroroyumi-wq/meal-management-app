"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

type LogoutButtonProps = {
  /** タブレットなど幅が狭いときはアイコンのみ表示 */
  iconOnly?: boolean;
};

export function LogoutButton({ iconOnly }: LogoutButtonProps) {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleLogout}
      className={iconOnly ? "min-h-10 min-w-10 p-0" : ""}
      title="ログアウト"
      aria-label="ログアウト"
    >
      {iconOnly ? (
        <LogOut className="size-5" />
      ) : (
        "ログアウト"
      )}
    </Button>
  );
}
