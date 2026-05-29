"use client";

import { localizeHref, type Locale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/browser";
import { useI18n } from "@/components/i18n-provider";

export function SignOutButton({
  compact = false,
  locale,
}: {
  compact?: boolean;
  locale: Locale;
}) {
  const { t } = useI18n();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.assign(localizeHref(locale, "/"));
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
      {t("common.actions.logout")}
    </button>
  );
}
