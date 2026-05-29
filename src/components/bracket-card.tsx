"use client";

import Link from "next/link";
import { useI18n } from "@/components/i18n-provider";
import { StatusBadge } from "@/components/status-badge";
import { localizeHref, type Locale } from "@/lib/i18n";
import type { Bracket } from "@/lib/types";

export function BracketCard({
  bracket,
  adminView = false,
  locale,
}: {
  bracket: Bracket;
  adminView?: boolean;
  locale: Locale;
}) {
  const { t } = useI18n();

  return (
    <article className="card rounded-[1.6rem] p-4 sm:rounded-[2rem] sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="eyebrow text-[0.78rem] text-accent sm:text-sm">{t("brackets.cardEyebrow")}</p>
          <h3 className="mt-2 text-xl font-extrabold text-forest sm:text-2xl">{bracket.name}</h3>
          <p className="mt-1 text-sm text-muted">{bracket.format}</p>
        </div>
        <StatusBadge
          label={t(`common.statuses.${bracket.status}`)}
          tone={bracket.status === "published" ? "published" : "draft"}
        />
      </div>

      <div className="mt-5 grid gap-2.5 sm:mt-6 sm:gap-3">
        {bracket.entries.length ? (
          bracket.entries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between rounded-[1.1rem] border border-line bg-white/70 px-3 py-2.5 sm:rounded-2xl sm:px-4 sm:py-3"
            >
              <div>
                <p className="text-sm font-semibold text-ink sm:text-base">{entry.profile.displayName}</p>
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
            {t("brackets.emptyCard")}
          </p>
        )}
      </div>

      {adminView && (
        <p className="mt-4 text-xs uppercase tracking-[0.18em] text-muted">
          {t("brackets.publishHint")}
        </p>
      )}

      {!adminView && (
        <div className="mt-4 flex justify-end">
          <Link
            href={localizeHref(locale, "/sign-up")}
            className="rounded-full border border-line px-4 py-2 text-sm font-semibold text-forest hover:border-forest hover:bg-forest hover:text-white"
          >
            {t("brackets.joinNext")}
          </Link>
        </div>
      )}
    </article>
  );
}
