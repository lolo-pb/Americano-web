"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { locales, type Locale } from "@/lib/i18n";
import { useI18n } from "@/components/i18n-provider";

function swapLocale(pathname: string, targetLocale: Locale) {
  const segments = pathname.split("/").filter(Boolean);

  if (!segments.length) {
    return `/${targetLocale}`;
  }

  if (locales.includes(segments[0] as Locale)) {
    segments[0] = targetLocale;
    return `/${segments.join("/")}`;
  }

  return `/${targetLocale}${pathname === "/" ? "" : pathname}`;
}

export function LanguageSwitcher() {
  const pathname = usePathname() || "/";
  const { locale, t } = useI18n();

  return (
    <div className="flex items-center gap-1 rounded-full border border-line bg-white/80 p-1">
      {locales.map((entry) => {
        const active = entry === locale;
        return (
          <Link
            key={entry}
            href={swapLocale(pathname, entry)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-bold tracking-[0.18em]",
              active ? "bg-forest text-white" : "text-muted hover:bg-surface-strong",
            )}
          >
            {t(`common.languages.${entry}`)}
          </Link>
        );
      })}
    </div>
  );
}
