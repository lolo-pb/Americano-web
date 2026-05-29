import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { SectionHeading } from "@/components/section-heading";
import { getViewerContext } from "@/lib/data";
import { hasSupabaseEnv } from "@/lib/env";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ registered?: string; email?: string }>;
}) {
  const viewer = await getViewerContext();
  const params = await searchParams;

  if (viewer.profile) {
    redirect("/me");
  }

  return (
    <div className="page-shell grid gap-8 py-10 sm:py-14 lg:grid-cols-[0.82fr_1.18fr]">
      <div className="space-y-6">
        <SectionHeading
          eyebrow="Welcome back"
          title="Track your status and tournament details."
          description="Players can log in to review approval status, update profile details, and confirm when their bracket has been published."
        />
        <div className="card rounded-[2rem] p-6 text-sm leading-7 text-muted">
          Pending players can still sign in. Your profile page will show whether your payment and tournament approval are still awaiting admin review.
        </div>
      </div>

      <LoginForm
        defaultEmail={params.email}
        enabled={hasSupabaseEnv()}
        justRegistered={params.registered === "1"}
      />
    </div>
  );
}
