import Link from "next/link";
import { SignOutButton } from "@/components/sign-out-button";
import { cn } from "@/lib/utils";
import type { ViewerContext } from "@/lib/types";

const navLinkClass =
  "rounded-full px-3 py-2 text-sm font-semibold text-ink/78 hover:bg-forest hover:text-white";

export function AppHeader({ viewer }: { viewer: ViewerContext }) {
  const profile = viewer.profile;

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-surface/85 backdrop-blur-xl">
      <div className="page-shell flex items-center justify-between gap-4 py-3">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-lg font-black text-white shadow-lg shadow-accent/20">
            AO
          </div>
          <div>
            <p className="eyebrow text-xl leading-none text-forest">Americano Open</p>
            <p className="text-xs text-muted">Play. Confirm. Publish.</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <Link href="/brackets" className={navLinkClass}>
            Brackets
          </Link>
          {profile ? (
            <>
              <Link href="/me" className={navLinkClass}>
                My profile
              </Link>
              {profile.role === "admin" && (
                <Link href="/admin" className={cn(navLinkClass, "bg-forest text-white")}>
                  Admin
                </Link>
              )}
              <SignOutButton />
            </>
          ) : (
            <>
              <Link href="/login" className={navLinkClass}>
                Log in
              </Link>
              <Link
                href="/sign-up"
                className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-strong"
              >
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>

      <div className="page-shell flex items-center gap-2 overflow-x-auto pb-3 md:hidden">
        <Link href="/brackets" className={navLinkClass}>
          Brackets
        </Link>
        {profile ? (
          <>
            <Link href="/me" className={navLinkClass}>
              My profile
            </Link>
            {profile.role === "admin" && (
              <Link href="/admin" className={cn(navLinkClass, "bg-forest text-white")}>
                Admin
              </Link>
            )}
            <SignOutButton compact />
          </>
        ) : (
          <>
            <Link href="/login" className={navLinkClass}>
              Log in
            </Link>
            <Link
              href="/sign-up"
              className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-strong"
            >
              Sign up
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
