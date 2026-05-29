import { updatePlayerStatusAction } from "@/app/actions";
import { SectionHeading } from "@/components/section-heading";
import { StatusBadge } from "@/components/status-badge";
import { getAdminPlayers, requireAdmin } from "@/lib/data";

export default async function AdminPlayersPage() {
  await requireAdmin();
  const players = await getAdminPlayers();

  return (
    <div className="page-shell py-10 sm:py-14">
      <SectionHeading
        eyebrow="Admin players"
        title="Approve players and confirm payments."
        description="This screen is intentionally desktop-friendly and operational: review player details, confirm payment, and move them into approved status."
      />

      <div className="mt-8 overflow-hidden rounded-[2rem] border border-line bg-surface shadow-sm">
        <div className="hidden grid-cols-[1.2fr_1fr_0.9fr_0.9fr_0.7fr] gap-4 border-b border-line px-6 py-4 text-xs font-bold uppercase tracking-[0.18em] text-muted lg:grid">
          <span>Player</span>
          <span>Contact</span>
          <span>Payment</span>
          <span>Approval</span>
          <span>Save</span>
        </div>

        <div className="grid">
          {players.map((player) => (
            <form
              key={player.id}
              action={updatePlayerStatusAction}
              className="grid gap-4 border-b border-line/80 px-6 py-5 last:border-b-0 lg:grid-cols-[1.2fr_1fr_0.9fr_0.9fr_0.7fr] lg:items-center"
            >
              <input type="hidden" name="profileId" value={player.id} />
              <div>
                <p className="font-bold text-ink">{player.displayName}</p>
                <p className="text-sm text-muted">@{player.username}</p>
                <div className="mt-2">
                  <StatusBadge label={player.approvalStatus} tone={player.approvalStatus} />
                </div>
              </div>
              <div className="text-sm text-muted">
                <p>{player.email}</p>
                <p>{player.phone ?? "No phone"}</p>
                <p>{player.category ?? "No category"}</p>
              </div>
              <select
                name="paymentStatus"
                defaultValue={player.paymentStatus}
                className="rounded-2xl border border-line bg-white px-4 py-3 text-sm"
              >
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="rejected">Rejected</option>
              </select>
              <select
                name="approvalStatus"
                defaultValue={player.approvalStatus}
                className="rounded-2xl border border-line bg-white px-4 py-3 text-sm"
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              <button
                type="submit"
                className="rounded-full bg-forest px-4 py-3 text-sm font-semibold text-white hover:bg-forest/90"
              >
                Save
              </button>
            </form>
          ))}
        </div>
      </div>
    </div>
  );
}
