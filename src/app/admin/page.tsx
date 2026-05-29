import Link from "next/link";
import { updatePlayerStatusAction } from "@/app/actions";
import { SectionHeading } from "@/components/section-heading";
import { StatusBadge } from "@/components/status-badge";
import { getAdminBrackets, getAdminPlayers, getTournament, requireAdmin } from "@/lib/data";

export default async function AdminDashboardPage() {
  await requireAdmin();
  const [players, brackets, tournament] = await Promise.all([
    getAdminPlayers(),
    getAdminBrackets(),
    getTournament(),
  ]);

  const pendingPlayers = players.filter((profile) => profile.approvalStatus === "pending");
  const publishedBrackets = brackets.filter((bracket) => bracket.status === "published");

  return (
    <div className="page-shell py-10 sm:py-14">
      <SectionHeading
        eyebrow="Admin dashboard"
        title="Keep approvals and brackets moving."
        description="The admin view focuses on the two bottlenecks that matter most in v1: confirming players and publishing the right bracket at the right time."
      />

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        <article className="card rounded-[1.8rem] p-6">
          <p className="eyebrow text-sm text-accent">Pending approvals</p>
          <p className="mt-3 text-4xl font-black text-forest">{pendingPlayers.length}</p>
        </article>
        <article className="card rounded-[1.8rem] p-6">
          <p className="eyebrow text-sm text-accent">Published brackets</p>
          <p className="mt-3 text-4xl font-black text-forest">{publishedBrackets.length}</p>
        </article>
        <article className="card rounded-[1.8rem] p-6">
          <p className="eyebrow text-sm text-accent">Active tournament</p>
          <p className="mt-3 text-xl font-black text-forest">{tournament.name}</p>
        </article>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.25fr_0.75fr]">
        <section className="card rounded-[2rem] p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-extrabold text-forest">Pending players</h2>
            <Link
              href="/admin/players"
              className="rounded-full border border-line px-4 py-2 text-sm font-semibold text-forest hover:border-forest hover:bg-forest hover:text-white"
            >
              Full player list
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
                        <option value="pending">Payment pending</option>
                        <option value="confirmed">Payment confirmed</option>
                        <option value="rejected">Payment rejected</option>
                      </select>
                      <select
                        name="approvalStatus"
                        defaultValue={player.approvalStatus}
                        className="rounded-full border border-line bg-white px-4 py-2 text-sm"
                      >
                        <option value="pending">Approval pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                      </select>
                      <button
                        type="submit"
                        className="rounded-full bg-forest px-4 py-2 text-sm font-semibold text-white hover:bg-forest/90"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </form>
              ))
            ) : (
              <p className="rounded-[1.5rem] border border-dashed border-line px-4 py-6 text-sm text-muted">
                No pending players right now.
              </p>
            )}
          </div>
        </section>

        <aside className="card rounded-[2rem] p-6">
          <h2 className="text-2xl font-extrabold text-forest">Publishing state</h2>
          <div className="mt-5 grid gap-4">
            {brackets.length ? (
              brackets.map((bracket) => (
                <div key={bracket.id} className="rounded-[1.5rem] border border-line bg-white/70 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-bold text-ink">{bracket.name}</p>
                      <p className="text-sm text-muted">{bracket.entries.length} players assigned</p>
                    </div>
                    <StatusBadge
                      label={bracket.status}
                      tone={bracket.status === "published" ? "published" : "draft"}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="rounded-[1.5rem] border border-dashed border-line px-4 py-6 text-sm text-muted">
                No brackets created yet.
              </p>
            )}
          </div>
          <Link
            href="/admin/brackets"
            className="mt-6 inline-flex rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white hover:bg-accent-strong"
          >
            Open bracket manager
          </Link>
        </aside>
      </div>
    </div>
  );
}
