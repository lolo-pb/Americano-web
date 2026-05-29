import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import type { Bracket } from "@/lib/types";

export function BracketCard({ bracket, adminView = false }: { bracket: Bracket; adminView?: boolean }) {
  return (
    <article className="card rounded-[2rem] p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="eyebrow text-sm text-accent">Bracket</p>
          <h3 className="mt-2 text-2xl font-extrabold text-forest">{bracket.name}</h3>
          <p className="mt-1 text-sm text-muted">{bracket.format}</p>
        </div>
        <StatusBadge
          label={bracket.status}
          tone={bracket.status === "published" ? "published" : "draft"}
        />
      </div>

      <div className="mt-6 grid gap-3">
        {bracket.entries.length ? (
          bracket.entries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between rounded-2xl border border-line bg-white/70 px-4 py-3"
            >
              <div>
                <p className="font-semibold text-ink">{entry.profile.displayName}</p>
                <p className="text-sm text-muted">@{entry.profile.username}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-forest">#{entry.position}</p>
                <p className="text-xs uppercase tracking-[0.2em] text-muted">
                  {entry.profile.category ?? "Open"}
                </p>
              </div>
            </div>
          ))
        ) : (
          <p className="rounded-2xl border border-dashed border-line px-4 py-6 text-sm text-muted">
            No players assigned yet.
          </p>
        )}
      </div>

      {adminView && (
        <p className="mt-4 text-xs uppercase tracking-[0.18em] text-muted">
          Publish when assignments are final and payment confirmations are complete.
        </p>
      )}

      {!adminView && (
        <div className="mt-4 flex justify-end">
          <Link
            href="/sign-up"
            className="rounded-full border border-line px-4 py-2 text-sm font-semibold text-forest hover:border-forest hover:bg-forest hover:text-white"
          >
            Join next draw
          </Link>
        </div>
      )}
    </article>
  );
}
