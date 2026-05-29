import Link from "next/link";
import { updatePlayerStatusAction } from "@/app/actions";
import { SectionHeading } from "@/components/section-heading";
import { StatusBadge } from "@/components/status-badge";
import { getAdminBrackets, getAdminPlayers, getTournament, requireAdmin } from "@/lib/data";
import { getDictionary, interpolate, localizeHref, type Locale } from "@/lib/i18n";

export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<unknown>;
}) {
  const { locale } = (await params) as { locale: Locale };
  await requireAdmin();
  const [players, brackets, tournament, dictionary] = await Promise.all([
    getAdminPlayers(),
    getAdminBrackets(),
    getTournament(),
    getDictionary(locale),
  ]);

  const pendingPlayers = players.filter((profile) => profile.approvalStatus === "pending");
  const publishedBrackets = brackets.filter((bracket) => bracket.status === "published");

  return (
    <div className="page-shell py-10 sm:py-14">
      <SectionHeading
        eyebrow={dictionary.admin.eyebrow}
        title={dictionary.admin.title}
        description={dictionary.admin.description}
      />

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        <article className="card rounded-[1.8rem] p-6">
          <p className="eyebrow text-sm text-accent">{dictionary.admin.pendingApprovals}</p>
          <p className="mt-3 text-4xl font-black text-forest">{pendingPlayers.length}</p>
        </article>
        <article className="card rounded-[1.8rem] p-6">
          <p className="eyebrow text-sm text-accent">{dictionary.admin.publishedBrackets}</p>
          <p className="mt-3 text-4xl font-black text-forest">{publishedBrackets.length}</p>
        </article>
        <article className="card rounded-[1.8rem] p-6">
          <p className="eyebrow text-sm text-accent">{dictionary.admin.activeTournament}</p>
          <p className="mt-3 text-xl font-black text-forest">{tournament.name}</p>
        </article>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.25fr_0.75fr]">
        <section className="card rounded-[2rem] p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-extrabold text-forest">{dictionary.admin.pendingPlayers}</h2>
            <Link
              href={localizeHref(locale, "/admin/players")}
              className="rounded-full border border-line px-4 py-2 text-sm font-semibold text-forest hover:border-forest hover:bg-forest hover:text-white"
            >
              {dictionary.admin.fullPlayerList}
            </Link>
          </div>

          <div className="mt-6 grid gap-4">
            {pendingPlayers.length ? (
              pendingPlayers.slice(0, 5).map((player) => (
                <form
                  key={player.id}
                  action={updatePlayerStatusAction}
                  className="rounded-[1.5rem] border border-line bg-white/70 p-4"
                >
                  <input type="hidden" name="profileId" value={player.id} />
                  <input type="hidden" name="locale" value={locale} />
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div>
                      <p className="font-bold text-ink">{player.displayName}</p>
                      <p className="text-sm text-muted">{player.email}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <select
                        name="paymentStatus"
                        defaultValue={player.paymentStatus}
                        className="rounded-full border border-line bg-white px-4 py-2 text-sm"
                      >
                        <option value="pending">{dictionary.common.statuses.pending}</option>
                        <option value="confirmed">{dictionary.common.statuses.confirmed}</option>
                        <option value="rejected">{dictionary.common.statuses.rejected}</option>
                      </select>
                      <select
                        name="approvalStatus"
                        defaultValue={player.approvalStatus}
                        className="rounded-full border border-line bg-white px-4 py-2 text-sm"
                      >
                        <option value="pending">{dictionary.common.statuses.pending}</option>
                        <option value="approved">{dictionary.common.statuses.approved}</option>
                        <option value="rejected">{dictionary.common.statuses.rejected}</option>
                      </select>
                      <button
                        type="submit"
                        className="rounded-full bg-forest px-4 py-2 text-sm font-semibold text-white hover:bg-forest/90"
                      >
                        {dictionary.common.actions.save}
                      </button>
                    </div>
                  </div>
                </form>
              ))
            ) : (
              <p className="rounded-[1.5rem] border border-dashed border-line px-4 py-6 text-sm text-muted">
                {dictionary.admin.noPendingPlayers}
              </p>
            )}
          </div>
        </section>

        <aside className="card rounded-[2rem] p-6">
          <h2 className="text-2xl font-extrabold text-forest">{dictionary.admin.publishingState}</h2>
          <div className="mt-5 grid gap-4">
            {brackets.length ? (
              brackets.map((bracket) => (
                <div key={bracket.id} className="rounded-[1.5rem] border border-line bg-white/70 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-bold text-ink">{bracket.name}</p>
                      <p className="text-sm text-muted">
                        {interpolate(dictionary.admin.assignedPlayers, { count: bracket.entries.length })}
                      </p>
                    </div>
                    <StatusBadge
                      label={dictionary.common.statuses[bracket.status]}
                      tone={bracket.status === "published" ? "published" : "draft"}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="rounded-[1.5rem] border border-dashed border-line px-4 py-6 text-sm text-muted">
                {dictionary.admin.noBrackets}
              </p>
            )}
          </div>
          <Link
            href={localizeHref(locale, "/admin/brackets")}
            className="mt-6 inline-flex rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white hover:bg-accent-strong"
          >
            {dictionary.admin.openBracketManager}
          </Link>
        </aside>
      </div>
    </div>
  );
}
