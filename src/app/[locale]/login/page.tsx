import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { SectionHeading } from "@/components/section-heading";
import { getViewerContext } from "@/lib/data";
import { hasSupabaseEnv } from "@/lib/env";
import { getDictionary, localizeHref, type Locale } from "@/lib/i18n";

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<unknown>;
  searchParams: Promise<unknown>;
}) {
  const { locale } = (await params) as { locale: Locale };
  const currentSearch = (await searchParams) as { registered?: string; email?: string };
  const [viewer, dictionary] = await Promise.all([getViewerContext(), getDictionary(locale)]);

  if (viewer.profile) {
    redirect(localizeHref(locale, "/me"));
  }

  return (
    <div className="page-shell grid gap-8 py-10 sm:py-14 lg:grid-cols-[0.82fr_1.18fr]">
      <div className="space-y-6">
        <SectionHeading
          eyebrow={dictionary.login.eyebrow}
          title={dictionary.login.title}
          description={dictionary.login.description}
        />
        <div className="card rounded-[2rem] p-6 text-sm leading-7 text-muted">
          {dictionary.login.pendingInfo}
        </div>
      </div>

      <LoginForm
        defaultEmail={currentSearch.email}
        enabled={hasSupabaseEnv()}
        justRegistered={currentSearch.registered === "1"}
        locale={locale}
      />
    </div>
  );
}
