import Link from "next/link";
import { notFound } from "next/navigation";
import { SectionHeading } from "@/components/section-heading";
import { StatusBadge } from "@/components/status-badge";
import { getPublicTeam } from "@/lib/data";
import { getDictionary, localizeHref, type Locale } from "@/lib/i18n";

export default async function TeamProfilePage({
  params,
}: {
  params: Promise<unknown>;
}) {
  const { locale, slug } = (await params) as { locale: Locale; slug: string };
  const [team, dictionary] = await Promise.all([getPublicTeam(slug), getDictionary(locale)]);

  if (!team) {
    notFound();
  }

  return (
    <div className="page-shell py-8 sm:py-14">
      <SectionHeading
        eyebrow={dictionary.playerProfile.eyebrow}
        title={team.teamName}
        description={dictionary.playerProfile.description}
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <aside className="card rounded-[1.6rem] p-4 sm:rounded-[2rem] sm:p-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-forest text-3xl font-black text-white sm:h-24 sm:w-24 sm:text-4xl">
            {team.playerOneName.slice(0, 1)}
          </div>
          <p className="mt-4 text-xl font-extrabold text-forest sm:mt-5 sm:text-2xl">{team.teamName}</p>
          <p className="mt-1 text-muted">{team.slug}</p>
          <div className="mt-4">
            <StatusBadge
              label={dictionary.common.statuses[team.approvalStatus]}
              tone={team.approvalStatus}
            />
          </div>
          <dl className="mt-6 grid gap-4 text-sm">
            <div>
              <dt className="font-semibold text-ink">{dictionary.playerProfile.players}</dt>
              <dd className="text-muted">
                {team.playerOneName}
                <br />
                {team.playerTwoName}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-ink">{dictionary.playerProfile.division}</dt>
              <dd className="text-muted">{team.category ?? dictionary.common.levels.open}</dd>
            </div>
          </dl>
        </aside>

        <section className="card rounded-[1.6rem] p-4 sm:rounded-[2rem] sm:p-6">
          <h2 className="text-lg font-extrabold text-forest sm:text-xl">{dictionary.playerProfile.about}</h2>
          <p className="mt-4 text-sm leading-6 text-muted sm:text-base sm:leading-7">{team.bio ?? dictionary.playerProfile.emptyBio}</p>

          <div className="mt-6">
            <Link
              href={localizeHref(locale, "/brackets")}
              className="rounded-full border border-line px-5 py-3 text-sm font-semibold text-forest hover:border-forest hover:bg-forest hover:text-white"
            >
              {dictionary.common.actions.backToBrackets}
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
