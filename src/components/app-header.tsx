"use client";

import Link from "next/link";
import { NavLinks } from "@/components/nav-links";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useI18n } from "@/components/i18n-provider";
import { localizeHref, type Locale } from "@/lib/i18n";
import type { ViewerContext } from "@/lib/types";

export function AppHeader({
  locale,
  viewer,
}: {
  locale: Locale;
  viewer: ViewerContext;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-surface/85 backdrop-blur-xl">
      <div className="page-shell flex items-center justify-between gap-4 py-3">
        <Link href={localizeHref(locale, "/")} className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-lg font-black text-white shadow-lg shadow-accent/20">
            AO
          </div>
          <div>
            <HeaderText />
          </div>
        </Link>

        <div className="hidden items-center gap-3 md:flex">
          <LanguageSwitcher />
          <nav className="flex items-center gap-1">
            <NavLinks locale={locale} viewer={viewer} />
          </nav>
        </div>
      </div>

      <div className="page-shell flex flex-col gap-3 pb-3 md:hidden">
        <div className="flex justify-end">
          <LanguageSwitcher />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto">
          <NavLinks locale={locale} viewer={viewer} mobile />
        </div>
      </div>
    </header>
  );
}

function HeaderText() {
  const { t } = useI18n();

  return (
    <>
      <p className="eyebrow text-xl leading-none text-forest">{t("common.appName")}</p>
      <p className="text-xs text-muted">{t("common.tagline")}</p>
    </>
  );
}
