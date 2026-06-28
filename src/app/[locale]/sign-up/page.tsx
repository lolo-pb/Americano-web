import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { SectionHeading } from "@/components/section-heading";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { getTournament, getViewerContext } from "@/lib/data";
import { env, hasSupabaseEnv } from "@/lib/env";
import { getDictionary, interpolate, localizeHref, type Locale } from "@/lib/i18n";
import { REFERRAL_CODE_COOKIE } from "@/lib/referral";

export default async function SignUpPage({
  params,
}: {
  params: Promise<unknown>;
}) {
  const { locale } = (await params) as { locale: Locale };
  const [viewer, tournament, dictionary] = await Promise.all([getViewerContext(), getTournament(), getDictionary(locale)]);
  const whatsappNumber = "+54 9 11 2650-7505";
  const phoneHref = "tel:+5491126507505";

  if (viewer.team) {
    redirect(localizeHref(locale, "/me"));
  }

  if (!tournament.signupOpen) {
    return (
      <>
        <div className="page-shell py-8 sm:py-14">
          <SectionHeading
            eyebrow={dictionary.signUp.closedEyebrow}
            title={dictionary.signUp.closedTitle}
            description={dictionary.signUp.closedDescription}
          />

          <div className="mt-8 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <section className="card rounded-[1.6rem] p-5 sm:rounded-[2rem] sm:p-8">
              <div className="rounded-[1.3rem] border border-line bg-white/70 p-5 sm:p-6">
                <p className="eyebrow text-sm text-accent">{dictionary.signUp.closedBannerEyebrow}</p>
                <h2 className="mt-3 text-2xl font-extrabold text-forest sm:text-3xl">
                  {dictionary.signUp.closedBannerTitle}
                </h2>
                <p className="mt-3 text-sm leading-6 text-muted sm:text-base sm:leading-7">
                  {dictionary.signUp.closedBannerBody}
                </p>
              </div>
            </section>

            <aside className="card rounded-[1.6rem] p-5 sm:rounded-[2rem] sm:p-8">
              <p className="eyebrow text-sm text-accent">{dictionary.signUp.closedContactEyebrow}</p>
              <h2 className="mt-3 text-2xl font-extrabold text-forest sm:text-3xl">
                {dictionary.signUp.closedContactTitle}
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted sm:text-base sm:leading-7">
                {dictionary.signUp.closedContactDescription}
              </p>

              <div className="mt-6 grid gap-3">
                <a
                  href={phoneHref}
                  className="rounded-[1.15rem] border border-line bg-white/70 px-4 py-3 text-sm font-semibold text-forest hover:border-forest hover:bg-forest hover:text-white"
                >
                  {dictionary.signUp.closedPhoneLabel}: {whatsappNumber}
                </a>
                <a
                  href={`mailto:${env.contactEmail}`}
                  className="rounded-[1.15rem] border border-line bg-white/70 px-4 py-3 text-sm font-semibold text-forest hover:border-forest hover:bg-forest hover:text-white"
                >
                  {dictionary.signUp.closedEmailLabel}: {env.contactEmail}
                </a>
                <WhatsAppButton
                  phoneNumber={whatsappNumber}
                  label={dictionary.signUp.closedWhatsAppAction}
                  className="inline-flex items-center justify-center gap-2 rounded-[1.15rem] bg-[#25D366] px-4 py-3 text-sm font-semibold text-white hover:bg-[#1fb759]"
                />
              </div>
            </aside>
          </div>
        </div>

        <div className="fixed bottom-4 right-4 z-30 sm:bottom-6 sm:right-6">
          <WhatsAppButton
            phoneNumber={whatsappNumber}
            label={dictionary.signUp.closedWhatsAppAction}
            className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_16px_40px_rgba(37,211,102,0.32)] hover:bg-[#1fb759]"
            labelClassName="sr-only"
          />
        </div>
      </>
    );
  }

  const cookieStore = await cookies();
  const referralCode = cookieStore.get(REFERRAL_CODE_COOKIE)?.value ?? null;

  return (
    <>
      <div className="page-shell grid gap-7 py-8 sm:gap-8 sm:py-14 lg:grid-cols-[0.82fr_1.18fr]">
        <div className="space-y-6">
          <SectionHeading
            eyebrow={dictionary.signUp.eyebrow}
            title={dictionary.signUp.title}
            description={dictionary.signUp.description}
          />
          <div className="card rounded-[1.6rem] p-4 sm:rounded-[2rem] sm:p-6">
            <h3 className="text-lg font-bold text-forest sm:text-xl">{dictionary.signUp.nextTitle}</h3>
            <ol className="mt-4 grid gap-3 text-sm leading-7 text-muted">
              {dictionary.signUp.steps.map((step) => (
                <li key={step}>
                  {interpolate(step, {
                    paymentAlias: env.paymentAlias,
                    contactEmail: env.contactEmail,
                  })}
                </li>
              ))}
            </ol>
          </div>
          <div className="card rounded-[1.6rem] p-4 sm:rounded-[2rem] sm:p-6">
            <p className="eyebrow text-sm text-accent">{dictionary.signUp.priceTitle}</p>
            <p className="mt-3 text-3xl font-extrabold text-forest sm:text-4xl">
              {dictionary.signUp.priceAmount}
            </p>
            <p className="mt-2 text-sm text-muted">
              {interpolate(dictionary.signUp.priceAliasLabel, {
                paymentAlias: env.paymentAlias,
              })}
            </p>
            <p className="mt-1 text-sm text-muted">
              {interpolate(dictionary.signUp.priceReceiptLabel, {
                contactEmail: env.contactEmail,
              })}
            </p>
          </div>
        </div>

        <SignUpForm
          paymentAlias={env.paymentAlias}
          contactEmail={env.contactEmail}
          enabled={hasSupabaseEnv()}
          locale={locale}
          referralCode={referralCode}
        />
      </div>

      <div className="fixed bottom-4 right-4 z-30 sm:bottom-6 sm:right-6">
        <WhatsAppButton
          phoneNumber={whatsappNumber}
          label={dictionary.signUp.whatsappHelpAction}
          className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_16px_40px_rgba(37,211,102,0.32)] hover:bg-[#1fb759]"
          labelClassName="sr-only"
        />
      </div>
    </>
  );
}
