import Link from "next/link";
import { approveBracketAction } from "@/app/actions";
import { BracketSetupEditor } from "@/components/bracket-setup-editor";
import { SectionHeading } from "@/components/section-heading";
import { getActiveAdminBracket, getApprovedTeams, getTournament, requireAdmin } from "@/lib/data";
import { getDictionary, localizeHref, type Locale } from "@/lib/i18n";

export default async function AdminBracketsPage({
  params,
}: {
  params: Promise<unknown>;
}) {
  const { locale } = (await params) as { locale: Locale };
  await requireAdmin(locale);

  const [tournament, bracket, teams, dictionary] = await Promise.all([
    getTournament(),
    getActiveAdminBracket(),
    getApprovedTeams(),
    getDictionary(locale),
  ]);

  return (
    <div className="page-shell py-8 sm:py-14">
      <SectionHeading
        eyebrow={dictionary.admin.brackets.eyebrow}
        title={dictionary.admin.brackets.title}
        description={dictionary.admin.brackets.description}
      />

      <div className="mt-8 grid gap-6">
        <section className="card rounded-[1.6rem] p-4 sm:rounded-[2rem] sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-forest sm:text-2xl">{dictionary.admin.brackets.createTitle}</h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">{dictionary.admin.brackets.createDescription}</p>
            </div>
            <div className="rounded-[1.3rem] border border-line bg-surface px-4 py-3 text-sm text-muted">
              <p className="font-bold text-ink">{dictionary.admin.brackets.sizeLabel}</p>
              <p>{dictionary.admin.brackets.sizeValue}</p>
            </div>
          </div>

          <div className="mt-6">
            <BracketSetupEditor tournamentId={tournament.id} bracket={bracket} teams={teams} locale={locale} />
          </div>
        </section>

        <section className="card rounded-[1.6rem] p-4 sm:rounded-[2rem] sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-forest sm:text-2xl">{dictionary.admin.brackets.approvalTitle}</h2>
              <p className="mt-3 text-sm leading-6 text-muted">{dictionary.admin.brackets.approvalDescription}</p>
            </div>

            {bracket?.setupLocked ? (
              <Link
                href={localizeHref(locale, "/admin/progress")}
                className="inline-flex rounded-full bg-forest px-5 py-3 text-sm font-semibold text-white hover:bg-forest/90"
              >
                {dictionary.admin.brackets.openProgress}
              </Link>
            ) : bracket ? (
              <form action={approveBracketAction}>
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="bracketId" value={bracket.id} />
                <button
                  type="submit"
                  className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white hover:bg-accent-strong"
                >
                  {dictionary.admin.brackets.approve}
                </button>
              </form>
            ) : null}
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="rounded-[1.3rem] border border-line bg-white/70 px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">{dictionary.admin.brackets.confirmedCount}</p>
              <p className="mt-2 text-2xl font-black text-forest">{teams.length}</p>
            </div>
            <div className="rounded-[1.3rem] border border-line bg-white/70 px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">{dictionary.admin.brackets.assignedCount}</p>
              <p className="mt-2 text-2xl font-black text-forest">{bracket?.entries.length ?? 0}</p>
            </div>
            <div className="rounded-[1.3rem] border border-line bg-white/70 px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">{dictionary.admin.brackets.lockState}</p>
              <p className="mt-2 text-base font-bold text-ink">
                {bracket?.setupLocked ? dictionary.admin.brackets.locked : dictionary.admin.brackets.unlocked}
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
