import { updatePlayerStatusAction } from "@/app/actions";
import { SectionHeading } from "@/components/section-heading";
import { StatusBadge } from "@/components/status-badge";
import { getAdminPlayers, requireAdmin } from "@/lib/data";
import { getDictionary, type Locale } from "@/lib/i18n";

export default async function AdminPlayersPage({
  params,
}: {
  params: Promise<unknown>;
}) {
  const { locale } = (await params) as { locale: Locale };
  await requireAdmin(locale);
  const [players, dictionary] = await Promise.all([getAdminPlayers(), getDictionary(locale)]);

  return (
    <div className="page-shell py-8 sm:py-14">
      <SectionHeading
        eyebrow={dictionary.admin.players.eyebrow}
        title={dictionary.admin.players.title}
        description={dictionary.admin.players.description}
      />

      <div className="mt-8 overflow-hidden rounded-[1.6rem] border border-line bg-surface shadow-sm sm:rounded-[2rem]">
        <div className="hidden grid-cols-[1.2fr_1fr_1fr_0.7fr] gap-4 border-b border-line px-6 py-4 text-xs font-bold uppercase tracking-[0.18em] text-muted lg:grid">
          <span>{dictionary.admin.players.columns.player}</span>
          <span>{dictionary.admin.players.columns.contact}</span>
          <span>{dictionary.admin.players.columns.status}</span>
          <span>{dictionary.admin.players.columns.save}</span>
        </div>

        <div className="grid">
          {players.map((player) => (
            <form
              key={player.id}
              action={updatePlayerStatusAction}
              className="grid gap-4 border-b border-line/80 px-6 py-5 last:border-b-0 lg:grid-cols-[1.2fr_1fr_1fr_0.7fr] lg:items-center"
            >
              <input type="hidden" name="profileId" value={player.id} />
              <input type="hidden" name="locale" value={locale} />
              <div>
                <p className="font-bold text-ink">{player.displayName}</p>
                <p className="text-sm text-muted">@{player.username}</p>
                <div className="mt-2">
                  <StatusBadge label={dictionary.common.statuses[player.approvalStatus]} tone={player.approvalStatus} />
                </div>
              </div>
              <div className="text-sm text-muted">
                <p>{player.email}</p>
                <p>{player.phone ?? dictionary.admin.players.noPhone}</p>
                <p>{player.category ?? dictionary.admin.players.noCategory}</p>
              </div>
              <select
                name="approvalStatus"
                defaultValue={player.approvalStatus}
                className="rounded-2xl border border-line bg-white px-4 py-3 text-sm"
              >
                <option value="pending">{dictionary.common.statuses.pending}</option>
                <option value="approved">{dictionary.common.statuses.approved}</option>
                <option value="rejected">{dictionary.common.statuses.rejected}</option>
              </select>
              <button
                type="submit"
                className="rounded-full bg-forest px-4 py-3 text-sm font-semibold text-white hover:bg-forest/90"
              >
                {dictionary.admin.players.approveAction}
              </button>
            </form>
          ))}
        </div>
      </div>
    </div>
  );
}
