import { saveBracketAction, toggleBracketPublishAction } from "@/app/actions";
import { BracketCard } from "@/components/bracket-card";
import { SectionHeading } from "@/components/section-heading";
import { getAdminBrackets, getApprovedTeams, getTournament, requireAdmin } from "@/lib/data";
import { getDictionary, type Locale } from "@/lib/i18n";

export default async function AdminBracketsPage({
  params,
}: {
  params: Promise<unknown>;
}) {
  const { locale } = (await params) as { locale: Locale };
  await requireAdmin(locale);

  const [tournament, brackets, teams, dictionary] = await Promise.all([
    getTournament(),
    getAdminBrackets(),
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

      <div className="mt-8 grid gap-8 xl:grid-cols-[1fr_1fr]">
        <section className="card rounded-[1.6rem] p-4 sm:rounded-[2rem] sm:p-6">
          <h2 className="text-xl font-extrabold text-forest sm:text-2xl">{dictionary.admin.brackets.createTitle}</h2>
          <p className="mt-3 text-sm leading-6 text-muted">{dictionary.admin.brackets.createDescription}</p>

          <form action={saveBracketAction} className="mt-6 grid gap-5">
            <input type="hidden" name="tournamentId" value={tournament.id} />
            <input type="hidden" name="locale" value={locale} />
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-ink">{dictionary.admin.brackets.fields.name}</span>
              <input
                name="name"
                placeholder={dictionary.admin.brackets.placeholders.name}
                className="rounded-2xl border border-line bg-white px-4 py-3 outline-none focus:border-forest"
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-ink">{dictionary.admin.brackets.fields.format}</span>
              <input
                name="format"
                defaultValue={dictionary.admin.brackets.placeholders.format}
                className="rounded-2xl border border-line bg-white px-4 py-3 outline-none focus:border-forest"
              />
            </label>

            <div className="grid gap-3">
              <span className="text-sm font-semibold text-ink">{dictionary.admin.brackets.fields.teams}</span>
              {teams.length ? (
                teams.map((team, index) => (
                  <div
                    key={team.id}
                    className="grid gap-3 rounded-[1.3rem] border border-line bg-white/80 px-4 py-3 md:grid-cols-[1fr_90px]"
                  >
                    <input type="hidden" name="teamId" value={team.id} />
                    <div>
                      <p className="font-bold text-ink">{team.teamName}</p>
                      <p className="text-sm text-muted">
                        {team.slug} · {team.category ?? dictionary.common.levels.open}
                      </p>
                    </div>
                    <label className="grid gap-1">
                      <span className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
                        {dictionary.admin.brackets.positionLabel}
                      </span>
                      <input
                        name="position"
                        type="number"
                        min="0"
                        defaultValue={index + 1}
                        className="rounded-xl border border-line bg-white px-3 py-2 text-sm outline-none focus:border-forest"
                      />
                    </label>
                  </div>
                ))
              ) : (
                <p className="rounded-[1.5rem] border border-dashed border-line px-4 py-6 text-sm text-muted">
                  {dictionary.admin.brackets.noApprovedPlayers}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="rounded-full bg-accent px-5 py-3 font-semibold text-white hover:bg-accent-strong"
            >
              {dictionary.admin.brackets.save}
            </button>
          </form>
        </section>

        <aside className="card rounded-[1.6rem] p-4 sm:rounded-[2rem] sm:p-6">
          <h2 className="text-xl font-extrabold text-forest sm:text-2xl">{dictionary.admin.brackets.approvedPlayers}</h2>
          <p className="mt-3 text-sm leading-6 text-muted">{dictionary.admin.brackets.selectionHelp}</p>
          <div className="mt-5 grid gap-3">
            {teams.length ? (
              teams.map((team) => (
                <div key={team.id} className="rounded-[1.5rem] border border-line bg-white/70 px-4 py-3">
                  <p className="font-bold text-ink">{team.teamName}</p>
                  <p className="text-sm text-muted">
                    {team.playerOneName} + {team.playerTwoName}
                  </p>
                  <p className="text-sm text-muted">
                    {team.slug} · {team.category ?? dictionary.common.levels.open}
                  </p>
                </div>
              ))
            ) : (
              <p className="rounded-[1.5rem] border border-dashed border-line px-4 py-6 text-sm text-muted">
                {dictionary.admin.brackets.noApprovedPlayers}
              </p>
            )}
          </div>
        </aside>
      </div>

      <div className="mt-10 grid gap-6">
        {brackets.length ? (
          brackets.map((bracket) => (
            <div key={bracket.id} className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
              <BracketCard bracket={bracket} adminView locale={locale} />
              <div className="card rounded-[1.6rem] p-4 sm:rounded-[2rem] sm:p-6">
                <h3 className="text-lg font-extrabold text-forest sm:text-xl">{dictionary.admin.brackets.publishingControls}</h3>
                <p className="mt-3 text-sm leading-6 text-muted">{dictionary.admin.brackets.publishingDescription}</p>

                <form action={toggleBracketPublishAction} className="mt-6">
                  <input type="hidden" name="bracketId" value={bracket.id} />
                  <input type="hidden" name="locale" value={locale} />
                  <input
                    type="hidden"
                    name="nextStatus"
                    value={bracket.status === "published" ? "draft" : "published"}
                  />
                  <button
                    type="submit"
                    className="rounded-full bg-forest px-5 py-3 font-semibold text-white hover:bg-forest/90"
                  >
                    {bracket.status === "published"
                      ? dictionary.admin.brackets.unpublish
                      : dictionary.admin.brackets.publish}
                  </button>
                </form>
              </div>
            </div>
          ))
        ) : (
          <div className="card rounded-[1.6rem] p-5 text-sm text-muted sm:rounded-[2rem] sm:p-8 sm:text-base">{dictionary.admin.brackets.empty}</div>
        )}
      </div>
    </div>
  );
}
