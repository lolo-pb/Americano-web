import { redirect } from "next/navigation";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { SectionHeading } from "@/components/section-heading";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { getViewerContext } from "@/lib/data";
import { env, hasSupabaseEnv } from "@/lib/env";
import { getDictionary, interpolate, localizeHref, type Locale } from "@/lib/i18n";

export default async function SignUpPage({
  params,
}: {
  params: Promise<unknown>;
}) {
  const { locale } = (await params) as { locale: Locale };
  const [viewer, dictionary] = await Promise.all([getViewerContext(), getDictionary(locale)]);
  const whatsappNumber = "+54 9 11 2650-7505";

  if (viewer.team) {
    redirect(localizeHref(locale, "/me"));
  }

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
