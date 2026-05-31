import Link from "next/link";
import { BracketProgressBoard } from "@/components/bracket-progress-board";
import { SectionHeading } from "@/components/section-heading";
import { StatusBadge } from "@/components/status-badge";
import { getPublicBracketView, getTournament, getViewerContext } from "@/lib/data";
import { env } from "@/lib/env";
import { getDictionary, interpolate, localizeHref, type Locale } from "@/lib/i18n";

function formatTournamentSchedule(startDate: string, locale: Locale) {
  const parsedDate = new Date(`${startDate}T00:00:00Z`);

  if (Number.isNaN(parsedDate.getTime())) {
    return `${startDate} - 13:00`;
  }

  const formattedDate = new Intl.DateTimeFormat(locale === "es" ? "es-AR" : "en-US", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(parsedDate);

  return `${formattedDate} - 13:00`;
}

export default async function HomePage({
  params,
}: {
  params: Promise<unknown>;
}) {
  const { locale } = (await params) as { locale: Locale };
  const [tournament, bracketView, viewer, dictionary] = await Promise.all([
    getTournament(),
    getPublicBracketView(),
    getViewerContext(),
    getDictionary(locale),
  ]);
  const tournamentSchedule = formatTournamentSchedule(tournament.startDate, locale);
  const instagramUrl = "https://www.instagram.com/tus_americanos/?utm_source=ig_web_button_share_sheet";
  const mapUrl = "https://maps.app.goo.gl/CqRLfQAob9PsTzuD9?g_st=iw";
  const contactEmails = ["tusamericanos@gmail.com"];

  return (
    <div className="pb-16">
      <section className="page-shell grid gap-8 py-8 sm:gap-10 sm:py-14 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
        <div className="space-y-8">
          <div className="space-y-5">
            <p className="eyebrow text-accent">{dictionary.home.eyebrow}</p>
            <h1 className="font-heading text-5xl leading-none text-forest sm:text-7xl">
              {dictionary.home.title}
            </h1>
            <p className="max-w-xl text-base leading-7 text-muted sm:text-lg sm:leading-8">{dictionary.home.description}</p>
            <p className="max-w-xl text-base font-bold leading-7 text-accent sm:text-lg sm:leading-8">
              {dictionary.home.deadlineNotice}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href={viewer.team ? localizeHref(locale, "/me") : localizeHref(locale, "/sign-up")}
              className="rounded-full bg-accent px-6 py-3 text-center font-semibold text-white hover:bg-accent-strong"
            >
              {viewer.team ? dictionary.common.actions.openProfile : dictionary.common.actions.signUp}
            </Link>
            <Link
              href={localizeHref(locale, "/brackets")}
              className="rounded-full border border-line px-6 py-3 text-center font-semibold text-forest hover:border-forest hover:bg-forest hover:text-white"
            >
              {dictionary.common.actions.viewBrackets}
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="card rounded-[1.75rem] p-5">
              <p className="eyebrow text-sm text-accent">{dictionary.home.location}</p>
              <p className="mt-2 text-lg font-bold text-ink">{tournament.location}</p>
              <a
                href={mapUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex text-sm font-semibold text-forest hover:text-accent"
              >
                {dictionary.common.actions.viewMap}
              </a>
            </div>
            <div className="card rounded-[1.75rem] p-5">
              <p className="eyebrow text-sm text-accent">{dictionary.home.startDate}</p>
              <p className="mt-2 text-lg font-bold text-ink">{tournamentSchedule}</p>
            </div>
            <div className="card rounded-[1.75rem] p-5">
              <p className="eyebrow text-sm text-accent">{dictionary.home.status}</p>
              <div className="mt-2">
                <StatusBadge
                  label={
                    tournament.signupOpen
                      ? dictionary.common.statuses.signupsOpen
                      : dictionary.common.statuses.closed
                  }
                  tone={tournament.signupOpen ? "approved" : "rejected"}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="card court-lines overflow-hidden rounded-[1.8rem] p-4 sm:rounded-[2.25rem] sm:p-8">
          <div className="rounded-[1.25rem] border border-white/60 bg-white/65 p-4 backdrop-blur sm:rounded-[1.5rem] sm:p-6">
            <p className="eyebrow text-sm text-accent">{dictionary.home.pitchEyebrow}</p>
            <h2 className="mt-3 text-2xl font-extrabold text-forest sm:text-3xl">{tournament.name}</h2>
            <p className="mt-4 text-sm leading-6 text-muted sm:text-base sm:leading-7">{tournament.description}</p>
            <div className="mt-6 grid gap-3">
              {dictionary.home.pitchSteps.map((item) => (
                <div key={item} className="rounded-2xl bg-forest px-4 py-3 text-sm font-medium text-white">
                  {interpolate(item, {
                    paymentAlias: env.paymentAlias,
                    contactEmail: env.contactEmail,
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="page-shell py-2 sm:py-4">
        <div className="grid gap-4 lg:grid-cols-[0.42fr_0.58fr]">
          <div className="card flex h-full flex-col overflow-hidden rounded-[1.75rem]">
            <iframe
              title={dictionary.common.actions.viewMap}
              src="https://www.google.com/maps?q=Belgrano%20Tenis&output=embed"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-[260px] w-full border-0 lg:min-h-[260px] lg:flex-1"
            />
            <div className="flex items-center justify-between gap-3 border-t border-line bg-white/80 px-5 py-4">
              <div>
                <p className="eyebrow text-xs text-accent">{dictionary.home.location}</p>
                <p className="mt-1 font-bold text-ink">{tournament.location}</p>
              </div>
              <a
                href={mapUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-line px-4 py-2 text-sm font-semibold text-forest hover:border-forest hover:bg-forest hover:text-white"
              >
                {dictionary.common.actions.viewMap}
              </a>
            </div>
          </div>

          <div className="card rounded-[1.75rem] px-5 py-5">
            <p className="eyebrow text-sm text-accent">{dictionary.home.contactEyebrow}</p>
            <p className="mt-2 text-lg font-bold text-ink">{dictionary.home.contactTitle}</p>
            <div className="mt-4 grid gap-3">
              {contactEmails.map((email) => (
                <a
                  key={email}
                  href={`mailto:${email}`}
                  className="flex items-center gap-3 rounded-[1.1rem] border border-line bg-white/70 px-4 py-3 text-sm text-forest hover:border-forest hover:bg-forest hover:text-white"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-forest text-xs font-black text-white">
                    @
                  </span>
                  <span className="break-all font-semibold">{email}</span>
                </a>
              ))}
            </div>
            <div className="mt-4">
              <a
                href={instagramUrl}
                target="_blank"
                rel="noreferrer"
                aria-label={dictionary.common.actions.instagram}
                className="flex items-center gap-3 rounded-[1.1rem] border border-line bg-white/70 px-4 py-3 text-sm text-forest hover:border-forest hover:bg-forest hover:text-white"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-white">
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="h-4.5 w-4.5 fill-none stroke-current"
                    strokeWidth="1.9"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
                    <circle cx="12" cy="12" r="4" />
                    <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
                  </svg>
                </span>
                <span className="font-semibold">@tus_americanos</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="page-shell-wide py-7 sm:py-14">
        <SectionHeading
          eyebrow={dictionary.home.playersEyebrow}
          title={dictionary.home.playersTitle}
          description={dictionary.home.playersDescription}
        />

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {dictionary.home.featureCards.map((item) => (
            <article key={item.title} className="card rounded-[1.8rem] p-6">
              <h3 className="text-xl font-extrabold text-forest">{item.title}</h3>
              <p className="mt-3 leading-7 text-muted">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="page-shell py-7 sm:py-14">
        <SectionHeading
          eyebrow={dictionary.home.publishedEyebrow}
          title={dictionary.home.publishedTitle}
          description={dictionary.home.publishedDescription}
        />

        {bracketView ? (
          <div className="mt-8 card rounded-[1.6rem] p-4 sm:rounded-[2rem] sm:p-6">
            <h3 className="text-xl font-extrabold text-forest sm:text-2xl">{bracketView.bracket.name}</h3>
            <p className="mt-1 text-sm text-muted">{bracketView.bracket.format}</p>
            <div className="mt-6">
              <BracketProgressBoard
                bracket={bracketView.bracket}
                columns={bracketView.columns}
                locale={locale}
                titles={dictionary.brackets.roundTitles}
                labels={{
                  slot: dictionary.brackets.slotLabel,
                  empty: dictionary.brackets.emptySlot,
                  won: dictionary.brackets.wonAction,
                  openLevel: dictionary.common.levels.open,
                }}
              />
            </div>
          </div>
        ) : (
          <div className="mt-8 card rounded-[1.6rem] p-5 text-sm text-muted sm:rounded-[2rem] sm:p-8 sm:text-base">
            {dictionary.home.emptyBrackets}
          </div>
        )}
      </section>

      <section className="page-shell pb-6 pt-2 sm:pb-10 sm:pt-4">
        <div className="card rounded-[1.8rem] px-6 py-8 text-center sm:px-10 sm:py-10">
          <h2 className="text-2xl font-extrabold text-forest sm:text-3xl">
            {dictionary.home.finalCtaTitle}
          </h2>
          <div className="mt-5 flex justify-center">
            <Link
              href={viewer.team ? localizeHref(locale, "/me") : localizeHref(locale, "/sign-up")}
              className="rounded-full bg-accent px-6 py-3 text-center font-semibold text-white hover:bg-accent-strong"
            >
              {dictionary.common.actions.signUp}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
