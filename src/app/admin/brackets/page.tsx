import { saveBracketAction, toggleBracketPublishAction } from "@/app/actions";
import { BracketCard } from "@/components/bracket-card";
import { SectionHeading } from "@/components/section-heading";
import { getAdminBrackets, getApprovedPlayers, getTournament, requireAdmin } from "@/lib/data";

export default async function AdminBracketsPage() {
  await requireAdmin();

  const [tournament, brackets, players] = await Promise.all([
    getTournament(),
    getAdminBrackets(),
    getApprovedPlayers(),
  ]);

  return (
    <div className="page-shell py-10 sm:py-14">
      <SectionHeading
        eyebrow="Bracket manager"
        title="Assign players and publish when ready."
        description="V1 keeps bracket management explicit and manual: create a bracket, assign player usernames in order, then publish it for everyone."
      />

      <div className="mt-8 grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="card rounded-[2rem] p-6">
          <h2 className="text-2xl font-extrabold text-forest">Create a bracket</h2>
          <p className="mt-3 text-sm leading-6 text-muted">
            Enter approved player usernames separated by commas in the order you want them assigned.
          </p>

          <form action={saveBracketAction} className="mt-6 grid gap-5">
            <input type="hidden" name="tournamentId" value={tournament.id} />
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-ink">Bracket name</span>
              <input
                name="name"
                placeholder="Saturday Sunrise Draw"
                className="rounded-2xl border border-line bg-white px-4 py-3 outline-none focus:border-forest"
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-ink">Format</span>
              <input
                name="format"
                defaultValue="Americano - 8 players"
                className="rounded-2xl border border-line bg-white px-4 py-3 outline-none focus:border-forest"
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-ink">Usernames in order</span>
              <textarea
                name="usernames"
                rows={5}
                placeholder="sofi-topspin, mateo-volley"
                className="rounded-2xl border border-line bg-white px-4 py-3 outline-none focus:border-forest"
              />
            </label>
            <button
              type="submit"
              className="rounded-full bg-accent px-5 py-3 font-semibold text-white hover:bg-accent-strong"
            >
              Save bracket
            </button>
          </form>
        </section>

        <aside className="card rounded-[2rem] p-6">
          <h2 className="text-2xl font-extrabold text-forest">Approved players</h2>
          <div className="mt-5 grid gap-3">
            {players.length ? (
              players.map((player) => (
                <div key={player.id} className="rounded-[1.5rem] border border-line bg-white/70 px-4 py-3">
                  <p className="font-bold text-ink">{player.displayName}</p>
                  <p className="text-sm text-muted">
                    @{player.username} · {player.category ?? "Open"}
                  </p>
                </div>
              ))
            ) : (
              <p className="rounded-[1.5rem] border border-dashed border-line px-4 py-6 text-sm text-muted">
                No approved players yet.
              </p>
            )}
          </div>
        </aside>
      </div>

      <div className="mt-10 grid gap-6">
        {brackets.length ? (
          brackets.map((bracket) => (
            <div key={bracket.id} className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
              <BracketCard bracket={bracket} adminView />
              <div className="card rounded-[2rem] p-6">
                <h3 className="text-xl font-extrabold text-forest">Publishing controls</h3>
                <p className="mt-3 text-sm leading-6 text-muted">
                  Toggle visibility on the public brackets page. Draft brackets stay admin-only.
                </p>

                <form action={toggleBracketPublishAction} className="mt-6">
                  <input type="hidden" name="bracketId" value={bracket.id} />
                  <input
                    type="hidden"
                    name="nextStatus"
                    value={bracket.status === "published" ? "draft" : "published"}
                  />
                  <button
                    type="submit"
                    className="rounded-full bg-forest px-5 py-3 font-semibold text-white hover:bg-forest/90"
                  >
                    {bracket.status === "published" ? "Unpublish bracket" : "Publish bracket"}
                  </button>
                </form>
              </div>
            </div>
          ))
        ) : (
          <div className="card rounded-[2rem] p-8 text-muted">
            No brackets created yet. Use the form above to create the first one.
          </div>
        )}
      </div>
    </div>
  );
}
