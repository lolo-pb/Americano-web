import { updateTeamAction } from "@/app/actions";
import { MercadoPagoCheckoutForm } from "@/components/mercadopago-checkout-form";
import { SectionHeading } from "@/components/section-heading";
import { StatusBadge } from "@/components/status-badge";
import { demoTeams } from "@/lib/mock-data";
import { getTournament, requireUser } from "@/lib/data";
import { env, hasSupabaseEnv } from "@/lib/env";
import { getDictionary, interpolate, type Locale } from "@/lib/i18n";
import { hasMercadoPagoEnv } from "@/lib/mercadopago";

export default async function MyProfilePage({
  params,
  searchParams,
}: {
  params: Promise<unknown>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = (await params) as { locale: Locale };
  const resolvedSearchParams = await searchParams;
  const [viewer, tournament, dictionary] = await Promise.all([
    requireUser(locale),
    getTournament(),
    getDictionary(locale),
  ]);
  const team = viewer.team ?? demoTeams[2];
  const canUseMercadoPago = !viewer.demoMode && hasSupabaseEnv() && hasMercadoPagoEnv();
  const paymentReturnValue = resolvedSearchParams.mp_return;
  const paymentReturn = Array.isArray(paymentReturnValue) ? paymentReturnValue[0] : paymentReturnValue;
  const receiptLabel = interpolate(dictionary.signUp.priceReceiptLabel, {
    contactEmail: env.contactEmail,
  });
  const receiptLabelParts = receiptLabel.split(env.contactEmail);
  const paymentStatusLabel = dictionary.common.paymentStatuses[team.paymentStatus];

  const paymentBanner =
    paymentReturn === "failure"
      ? { tone: "failed" as const, text: dictionary.me.paymentReturnFailure }
      : paymentReturn === "pending"
        ? { tone: "pending" as const, text: dictionary.me.paymentReturnPending }
        : paymentReturn === "success" && team.paymentStatus === "paid"
          ? { tone: "paid" as const, text: dictionary.me.paymentReturnSuccess }
          : paymentReturn === "success"
            ? { tone: "pending" as const, text: dictionary.me.paymentReturnPending }
            : team.paymentStatus === "paid"
              ? { tone: "paid" as const, text: dictionary.me.paymentReceived }
              : team.paymentStatus === "failed"
                ? { tone: "failed" as const, text: dictionary.me.paymentFailed }
                : team.paymentStatus === "refunded"
                  ? { tone: "refunded" as const, text: dictionary.me.paymentRefunded }
                  : null;

  return (
    <div className="page-shell grid gap-7 py-8 sm:gap-8 sm:py-14 lg:grid-cols-[0.82fr_1.18fr]">
      <div className="space-y-6">
        <SectionHeading
          eyebrow={dictionary.me.eyebrow}
          title={team.teamName}
          description={dictionary.me.description}
        />

        <div className="card rounded-[1.6rem] p-4 sm:rounded-[2rem] sm:p-6">
          <div className="flex flex-wrap gap-3">
            <StatusBadge label={dictionary.common.statuses[team.approvalStatus]} tone={team.approvalStatus} />
            <StatusBadge label={paymentStatusLabel} tone={team.paymentStatus} />
          </div>
          <dl className="mt-5 grid gap-4 text-sm">
            <div>
              <dt className="font-semibold text-ink">{dictionary.me.email}</dt>
              <dd className="text-muted">{team.email}</dd>
            </div>
            <div>
              <dt className="font-semibold text-ink">{dictionary.me.teamSlug}</dt>
              <dd className="text-muted">{team.slug}</dd>
            </div>
            <div>
              <dt className="font-semibold text-ink">{dictionary.me.tournament}</dt>
              <dd className="text-muted">{tournament.name}</dd>
            </div>
            <div>
              <dt className="font-semibold text-ink">{dictionary.me.paymentInbox}</dt>
              <dd className="text-muted">{env.paymentAlias}</dd>
            </div>
            <div>
              <dt className="font-semibold text-ink">{dictionary.me.paymentStatus}</dt>
              <dd className="text-muted">{paymentStatusLabel}</dd>
            </div>
            <div>
              <dt className="font-semibold text-ink">{dictionary.me.bracketVisibility}</dt>
              <dd className="text-muted">
                {tournament.bracketsPublished ? dictionary.me.published : dictionary.me.notPublished}
              </dd>
            </div>
          </dl>
        </div>

        {paymentBanner && (
          <div className="card rounded-[1.6rem] p-4 sm:rounded-[2rem] sm:p-6">
            <StatusBadge label={dictionary.common.paymentStatuses[paymentBanner.tone]} tone={paymentBanner.tone} />
            <p className="mt-3 text-sm leading-6 text-muted">{paymentBanner.text}</p>
          </div>
        )}

        {team.approvalStatus === "pending" && (
          <div className="card rounded-[1.6rem] p-4 text-center sm:rounded-[2rem] sm:p-6">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">
              {dictionary.signUp.submitAliasTitle}
            </p>
            <p className="mt-2 text-2xl font-extrabold text-forest">{env.paymentAlias}</p>
            <p className="mt-2 text-sm text-muted">
              {receiptLabelParts[0]}
              <a
                href={`mailto:${env.contactEmail}`}
                className="text-base font-semibold text-forest underline decoration-forest/30 underline-offset-2"
              >
                {env.contactEmail}
              </a>
              {receiptLabelParts.slice(1).join(env.contactEmail)}
            </p>
            {canUseMercadoPago && team.paymentStatus !== "paid" && (
              <MercadoPagoCheckoutForm
                locale={locale}
                label={dictionary.signUp.mercadoPagoAction}
                className="mx-auto mt-4 inline-flex rounded-full bg-sky-600 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-700"
              />
            )}
          </div>
        )}

      </div>

      <form action={updateTeamAction} className="card rounded-[1.6rem] p-4 sm:rounded-[2rem] sm:p-8">
        <input type="hidden" name="locale" value={locale} />
        <h2 className="text-xl font-extrabold text-forest sm:text-2xl">{dictionary.me.updateTitle}</h2>
        <div className="mt-6 grid gap-5">
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-ink">{dictionary.signUp.fields.playerOneName}</span>
            <input
              name="playerOneName"
              defaultValue={team.playerOneName}
              className="rounded-2xl border border-line bg-white px-4 py-3 outline-none focus:border-forest"
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-ink">{dictionary.signUp.fields.playerTwoName}</span>
            <input
              name="playerTwoName"
              defaultValue={team.playerTwoName}
              className="rounded-2xl border border-line bg-white px-4 py-3 outline-none focus:border-forest"
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-ink">{dictionary.signUp.fields.phone}</span>
            <input
              name="phone"
              defaultValue={team.phone ?? ""}
              className="rounded-2xl border border-line bg-white px-4 py-3 outline-none focus:border-forest"
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-ink">{dictionary.signUp.fields.category}</span>
            <select
              name="category"
              defaultValue={team.category ?? ""}
              className="rounded-2xl border border-line bg-white px-4 py-3 outline-none focus:border-forest"
            >
              <option value="">{dictionary.common.levels.select}</option>
              <option value="Beginner">{dictionary.common.levels.beginner}</option>
              <option value="Intermediate">{dictionary.common.levels.intermediate}</option>
              <option value="Advanced">{dictionary.common.levels.advanced}</option>
            </select>
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-ink">{dictionary.me.bio}</span>
            <textarea
              name="bio"
              defaultValue={team.bio ?? ""}
              rows={4}
              className="rounded-2xl border border-line bg-white px-4 py-3 outline-none focus:border-forest"
            />
          </label>
          <button
            type="submit"
            className="rounded-full bg-forest px-5 py-3 font-semibold text-white hover:bg-forest/90"
          >
            {dictionary.common.actions.save}
          </button>
        </div>
      </form>
    </div>
  );
}
