import Link from "next/link";
import { updateProfileAction } from "@/app/actions";
import { SectionHeading } from "@/components/section-heading";
import { StatusBadge } from "@/components/status-badge";
import { env } from "@/lib/env";
import { demoProfiles } from "@/lib/mock-data";
import { getTournament, requireUser } from "@/lib/data";

export default async function MyProfilePage() {
  const [viewer, tournament] = await Promise.all([requireUser(), getTournament()]);
  const profile = viewer.profile ?? demoProfiles[2];

  return (
    <div className="page-shell grid gap-8 py-10 sm:py-14 lg:grid-cols-[0.82fr_1.18fr]">
      <div className="space-y-6">
        <SectionHeading
          eyebrow="My status"
          title={profile.displayName}
          description="This page keeps the player informed about payment, approval, and published tournament information."
        />

        <div className="card rounded-[2rem] p-6">
          <div className="flex flex-wrap gap-3">
            <StatusBadge label={profile.approvalStatus} tone={profile.approvalStatus} />
            <StatusBadge label={profile.paymentStatus} tone={profile.paymentStatus} />
          </div>
          <dl className="mt-5 grid gap-4 text-sm">
            <div>
              <dt className="font-semibold text-ink">Tournament</dt>
              <dd className="text-muted">{tournament.name}</dd>
            </div>
            <div>
              <dt className="font-semibold text-ink">Payment inbox</dt>
              <dd className="text-muted">{env.paymentEmail}</dd>
            </div>
            <div>
              <dt className="font-semibold text-ink">Bracket visibility</dt>
              <dd className="text-muted">
                {tournament.bracketsPublished
                  ? "Published brackets are live now."
                  : "Brackets are not published yet."}
              </dd>
            </div>
          </dl>
        </div>

        <div className="card rounded-[2rem] p-6 text-sm leading-7 text-muted">
          If your payment is still pending, email the proof to {env.paymentEmail}. Once the admin confirms it, your approval can move forward and your bracket assignment can be published.
        </div>

        <Link
          href="/brackets"
          className="inline-flex rounded-full border border-line px-5 py-3 text-sm font-semibold text-forest hover:border-forest hover:bg-forest hover:text-white"
        >
          Check the brackets page
        </Link>
      </div>

      <form action={updateProfileAction} className="card rounded-[2rem] p-6 sm:p-8">
        <h2 className="text-2xl font-extrabold text-forest">Update profile</h2>
        <div className="mt-6 grid gap-5">
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-ink">Display name</span>
            <input
              name="displayName"
              defaultValue={profile.displayName}
              className="rounded-2xl border border-line bg-white px-4 py-3 outline-none focus:border-forest"
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-ink">Phone</span>
            <input
              name="phone"
              defaultValue={profile.phone ?? ""}
              className="rounded-2xl border border-line bg-white px-4 py-3 outline-none focus:border-forest"
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-ink">Category</span>
            <select
              name="category"
              defaultValue={profile.category ?? ""}
              className="rounded-2xl border border-line bg-white px-4 py-3 outline-none focus:border-forest"
            >
              <option value="">Select level</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-ink">Bio</span>
            <textarea
              name="bio"
              defaultValue={profile.bio ?? ""}
              rows={4}
              className="rounded-2xl border border-line bg-white px-4 py-3 outline-none focus:border-forest"
            />
          </label>
          <button
            type="submit"
            className="rounded-full bg-forest px-5 py-3 font-semibold text-white hover:bg-forest/90"
          >
            Save profile
          </button>
        </div>
      </form>
    </div>
  );
}
