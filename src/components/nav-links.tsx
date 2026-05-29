"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/components/i18n-provider";
import { SignOutButton } from "@/components/sign-out-button";
import { localizeHref, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { ViewerContext } from "@/lib/types";

const baseLinkClass =
  "rounded-full px-3 py-2 text-sm font-semibold text-ink/78 hover:bg-forest hover:text-white";
const activeLinkClass = "bg-forest text-white";

function isActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function NavLinks({
  locale,
  viewer,
  mobile = false,
}: {
  locale: Locale;
  viewer: ViewerContext;
  mobile?: boolean;
}) {
  const pathname = usePathname();
  const { t } = useI18n();
  const team = viewer.team;

  const linkClass = (href: string) =>
    cn(baseLinkClass, isActive(pathname, localizeHref(locale, href)) && activeLinkClass);

  return (
    <>
      <Link href={localizeHref(locale, "/brackets")} className={linkClass("/brackets")}>
        {t("nav.brackets")}
      </Link>
      {team ? (
        <>
          <Link href={localizeHref(locale, "/me")} className={linkClass("/me")}>
            {t("nav.profile")}
          </Link>
          {team.role === "admin" && (
            <Link href={localizeHref(locale, "/admin")} className={linkClass("/admin")}>
              {t("nav.admin")}
            </Link>
          )}
          <SignOutButton compact={mobile} locale={locale} />
        </>
      ) : (
        <>
          <Link href={localizeHref(locale, "/login")} className={linkClass("/login")}>
            {t("nav.login")}
          </Link>
          <Link
            href={localizeHref(locale, "/sign-up")}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-semibold",
              isActive(pathname, localizeHref(locale, "/sign-up"))
                ? "bg-accent-strong text-white"
                : "bg-accent text-white hover:bg-accent-strong",
            )}
          >
            {t("nav.signUp")}
          </Link>
        </>
      )}
    </>
  );
}
