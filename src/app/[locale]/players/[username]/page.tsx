import Link from "next/link";
import { notFound } from "next/navigation";
import { SectionHeading } from "@/components/section-heading";
import { StatusBadge } from "@/components/status-badge";
import { getPublicProfile } from "@/lib/data";
import { getDictionary, localizeHref, type Locale } from "@/lib/i18n";

export default async function PlayerProfilePage({
  params,
}: {
  params: Promise<unknown>;
}) {
  const { locale, username } = (await params) as { locale: Locale; username: string };
  const [profile, dictionary] = await Promise.all([getPublicProfile(username), getDictionary(locale)]);

  if (!profile) {
    notFound();
  }

  return (
    <div className="page-shell py-10 sm:py-14">
      <SectionHeading
        eyebrow={dictionary.playerProfile.eyebrow}
        title={profile.displayName}
        description={dictionary.playerProfile.description}
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <aside className="card rounded-[2rem] p-6">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-forest text-4xl font-black text-white">
            {profile.displayName.slice(0, 1)}
          </div>
          <p className="mt-5 text-2xl font-extrabold text-forest">{profile.displayName}</p>
          <p className="mt-1 text-muted">@{profile.username}</p>
          <div className="mt-4">
            <StatusBadge
              label={dictionary.common.statuses[profile.approvalStatus]}
              tone={profile.approvalStatus}
            />
          </div>
          <dl className="mt-6 grid gap-4 text-sm">
            <div>
              <dt className="font-semibold text-ink">{dictionary.playerProfile.division}</dt>
              <dd className="text-muted">{profile.category ?? dictionary.common.levels.open}</dd>
            </div>
          </dl>
        </aside>

        <section className="card rounded-[2rem] p-6">
          <h2 className="text-xl font-extrabold text-forest">{dictionary.playerProfile.about}</h2>
          <p className="mt-4 leading-7 text-muted">{profile.bio ?? dictionary.playerProfile.emptyBio}</p>

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
