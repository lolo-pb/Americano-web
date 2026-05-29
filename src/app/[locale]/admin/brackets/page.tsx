import { saveBracketAction, toggleBracketPublishAction } from "@/app/actions";
import { BracketCard } from "@/components/bracket-card";
import { SectionHeading } from "@/components/section-heading";
import { getAdminBrackets, getApprovedPlayers, getTournament, requireAdmin } from "@/lib/data";
import { getDictionary, type Locale } from "@/lib/i18n";

export default async function AdminBracketsPage({
  params,
}: {
  params: Promise<unknown>;
}) {
  const { locale } = (await params) as { locale: Locale };
  await requireAdmin();

  const [tournament, brackets, players, dictionary] = await Promise.all([
    getTournament(),
    getAdminBrackets(),
    getApprovedPlayers(),
    getDictionary(locale),
  ]);

  return (
    <div className="page-shell py-8 sm:py-14">
      <SectionHeading
        eyebrow={dictionary.admin.brackets.eyebrow}
        title={dictionary.admin.brackets.title}
        description={dictionary.admin.brackets.description}
      />

      <div className="mt-8 grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
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
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-ink">{dictionary.admin.brackets.fields.usernames}</span>
              <textarea
                name="usernames"
                rows={5}
                placeholder={dictionary.admin.brackets.placeholders.usernames}
                className="rounded-2xl border border-line bg-white px-4 py-3 outline-none focus:border-forest"
              />
            </label>
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
          <div className="mt-5 grid gap-3">
            {players.length ? (
              players.map((player) => (
                <div key={player.id} className="rounded-[1.5rem] border border-line bg-white/70 px-4 py-3">
                  <p className="font-bold text-ink">{player.displayName}</p>
                  <p className="text-sm text-muted">
                    @{player.username} · {player.category ?? dictionary.common.levels.open}
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
