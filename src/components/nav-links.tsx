"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/components/sign-out-button";
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
  viewer,
  mobile = false,
}: {
  viewer: ViewerContext;
  mobile?: boolean;
}) {
  const pathname = usePathname();
  const profile = viewer.profile;

  const linkClass = (href: string) =>
    cn(baseLinkClass, isActive(pathname, href) && activeLinkClass);

  return (
    <>
      <Link href="/brackets" className={linkClass("/brackets")}>
        Brackets
      </Link>
      {profile ? (
        <>
          <Link href="/me" className={linkClass("/me")}>
            My profile
          </Link>
          {profile.role === "admin" && (
            <Link href="/admin" className={linkClass("/admin")}>
              Admin
            </Link>
          )}
          <SignOutButton compact={mobile} />
        </>
      ) : (
        <>
          <Link href="/login" className={linkClass("/login")}>
            Log in
          </Link>
          <Link
            href="/sign-up"
            className={cn(
              "rounded-full px-4 py-2 text-sm font-semibold",
              isActive(pathname, "/sign-up")
                ? "bg-accent-strong text-white"
                : "bg-accent text-white hover:bg-accent-strong",
            )}
          >
            Sign up
          </Link>
        </>
      )}
    </>
  );
}
