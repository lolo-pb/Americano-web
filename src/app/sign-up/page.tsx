import { redirect } from "next/navigation";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { SectionHeading } from "@/components/section-heading";
import { env, hasSupabaseEnv } from "@/lib/env";
import { getViewerContext } from "@/lib/data";

export default async function SignUpPage() {
  const viewer = await getViewerContext();

  if (viewer.profile) {
    redirect("/me");
  }

  return (
    <div className="page-shell grid gap-8 py-10 sm:py-14 lg:grid-cols-[0.82fr_1.18fr]">
      <div className="space-y-6">
        <SectionHeading
          eyebrow="Registration"
          title="Save your place in the next draw."
          description="Create your account, send payment proof by email, and the admin will approve your entry before bracket publication."
        />
        <div className="card rounded-[2rem] p-6">
          <h3 className="text-xl font-bold text-forest">What happens next</h3>
          <ol className="mt-4 grid gap-3 text-sm leading-7 text-muted">
            <li>1. Create your account with your player details.</li>
            <li>2. Send your payment proof to {env.paymentEmail}.</li>
            <li>3. Wait for admin confirmation and watch the brackets page for publication.</li>
          </ol>
        </div>
      </div>

      <SignUpForm paymentEmail={env.paymentEmail} enabled={hasSupabaseEnv()} />
    </div>
  );
}
