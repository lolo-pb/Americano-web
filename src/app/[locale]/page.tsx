import Link from "next/link";
import { BracketProgressBoard } from "@/components/bracket-progress-board";
import { SectionHeading } from "@/components/section-heading";
import { StatusBadge } from "@/components/status-badge";
import { getPublicBracketView, getTournament, getViewerContext } from "@/lib/data";
import { getDictionary, localizeHref, type Locale } from "@/lib/i18n";

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
            </div>
            <div className="card rounded-[1.75rem] p-5">
              <p className="eyebrow text-sm text-accent">{dictionary.home.startDate}</p>
              <p className="mt-2 text-lg font-bold text-ink">{tournament.startDate}</p>
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
                  {item}
                </div>
              ))}
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
    </div>
  );
}
