"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { createClient } from "@/lib/supabase/browser";

const loginSchema = z.object({
  email: z.email("Use a valid email."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

type LoginValues = z.infer<typeof loginSchema>;

export function LoginForm({
  defaultEmail,
  enabled,
  justRegistered,
}: {
  defaultEmail?: string;
  enabled: boolean;
  justRegistered: boolean;
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: defaultEmail ?? "",
    },
  });

  async function onSubmit(values: LoginValues) {
    if (!enabled) {
      setServerError("Supabase is not configured yet. Add the environment variables to enable login.");
      return;
    }

    setServerError(null);
    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword(values);

      if (error) {
        setServerError(error.message);
        return;
      }

      router.refresh();
      router.push("/me");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Login failed.";
      setServerError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="card rounded-[2rem] p-6 sm:p-8">
      <div className="grid gap-5">
        {justRegistered && (
          <div className="rounded-2xl bg-forest-soft px-4 py-4 text-sm text-forest">
            Account created. You can log in now and track your approval status from your profile page.
          </div>
        )}

        <label className="grid gap-2">
          <span className="text-sm font-semibold text-ink">Email</span>
          <input
            {...register("email")}
            type="email"
            className="rounded-2xl border border-line bg-white px-4 py-3 outline-none focus:border-forest"
            placeholder="you@example.com"
          />
          {errors.email && <p className="text-sm text-danger">{errors.email.message}</p>}
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-semibold text-ink">Password</span>
          <input
            {...register("password")}
            type="password"
            className="rounded-2xl border border-line bg-white px-4 py-3 outline-none focus:border-forest"
            placeholder="Your password"
          />
          {errors.password && <p className="text-sm text-danger">{errors.password.message}</p>}
        </label>

        {serverError && <p className="text-sm text-danger">{serverError}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-full bg-forest px-5 py-3 font-semibold text-white hover:bg-forest/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Logging in..." : "Log in"}
        </button>

        <p className="text-sm text-muted">
          Need an account?{" "}
          <Link href="/sign-up" className="font-semibold text-forest hover:text-accent">
            Sign up here
          </Link>
        </p>
      </div>
    </form>
  );
}
