import Link from "next/link";
import { NavLinks } from "@/components/nav-links";
import type { ViewerContext } from "@/lib/types";

export function AppHeader({ viewer }: { viewer: ViewerContext }) {
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
          <NavLinks viewer={viewer} />
        </nav>
      </div>

      <div className="page-shell flex items-center gap-2 overflow-x-auto pb-3 md:hidden">
        <NavLinks viewer={viewer} mobile />
      </div>
    </header>
  );
}
