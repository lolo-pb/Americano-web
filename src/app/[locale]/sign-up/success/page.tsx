import Link from "next/link";
import { SectionHeading } from "@/components/section-heading";
import { env } from "@/lib/env";
import { getDictionary, interpolate, localizeHref, type Locale } from "@/lib/i18n";

export default async function SignUpSuccessPage({
  params,
}: {
  params: Promise<unknown>;
}) {
  const { locale } = (await params) as { locale: Locale };
  const dictionary = await getDictionary(locale);
  const receiptLabel = interpolate(dictionary.signUp.priceReceiptLabel, {
    contactEmail: env.contactEmail,
  });
  const receiptLabelParts = receiptLabel.split(env.contactEmail);

  return (
    <div className="page-shell py-8 sm:py-14">
      <div className="mx-auto max-w-2xl card rounded-[1.8rem] p-5 text-center sm:rounded-[2.2rem] sm:p-8">
        <div className="text-center">
          <SectionHeading
            eyebrow={dictionary.signUp.successEyebrow}
            title={dictionary.signUp.successTitle}
            description={interpolate(dictionary.signUp.successDescription, {
              paymentAlias: env.paymentAlias,
            })}
          />
        </div>

        <div className="mx-auto mt-6 max-w-md rounded-[1.15rem] border border-forest/20 bg-white px-4 py-3 text-center sm:rounded-2xl sm:px-5 sm:py-4">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">
            {dictionary.signUp.submitAliasTitle}
          </p>
          <p className="mt-2 text-xl font-extrabold text-forest sm:text-2xl">{env.paymentAlias}</p>
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
        </div>

        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href={localizeHref(locale, "/me")}
            className="rounded-full bg-accent px-6 py-3 text-center font-semibold text-white hover:bg-accent-strong"
          >
            {dictionary.signUp.successProfileAction}
          </Link>
          <Link
            href={localizeHref(locale, "/brackets")}
            className="rounded-full border border-line px-6 py-3 text-center font-semibold text-forest hover:border-forest hover:bg-forest hover:text-white"
          >
            {dictionary.signUp.successBracketsAction}
          </Link>
        </div>
      </div>
    </div>
  );
}
