import { redirect } from "next/navigation";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { SectionHeading } from "@/components/section-heading";
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

  if (viewer.profile) {
    redirect(localizeHref(locale, "/me"));
  }

  return (
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
              <li key={step}>{interpolate(step, { paymentEmail: env.paymentEmail })}</li>
            ))}
          </ol>
        </div>
      </div>

      <SignUpForm paymentEmail={env.paymentEmail} enabled={hasSupabaseEnv()} locale={locale} />
    </div>
  );
}
