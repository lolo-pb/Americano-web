"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

export function SignOutButton({ compact = false }: { compact?: boolean }) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
    router.push("/");
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className={
        compact
          ? "rounded-full border border-line px-3 py-2 text-sm font-semibold text-ink hover:border-forest hover:text-forest"
          : "rounded-full border border-line px-4 py-2 text-sm font-semibold text-ink hover:border-forest hover:text-forest"
      }
    >
      Sign out
    </button>
  );
}
