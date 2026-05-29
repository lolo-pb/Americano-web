"use client";

import { useI18n } from "@/components/i18n-provider";

export function DemoModeBanner({ demoMode }: { demoMode: boolean }) {
  const { t } = useI18n();

  if (!demoMode) {
    return null;
  }

  return (
    <div className="border-b border-gold/60 bg-gold/20 px-4 py-3 text-center text-sm text-ink">
      {t("common.demoMode")}
    </div>
  );
}
