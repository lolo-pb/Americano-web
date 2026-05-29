"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useI18n } from "@/components/i18n-provider";
import { localizeHref, type Locale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/browser";
type LoginValues = {
  email: string;
  password: string;
};

export function LoginForm({
  defaultEmail,
  enabled,
  justRegistered,
  locale,
}: {
  defaultEmail?: string;
  enabled: boolean;
  justRegistered: boolean;
  locale: Locale;
}) {
  const router = useRouter();
  const { t } = useI18n();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const loginSchema = z.object({
    email: z.email(t("login.errors.email")),
    password: z.string().min(8, t("login.errors.password")),
  });
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
      setServerError(t("login.errors.supabase"));
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
      router.push(localizeHref(locale, "/me"));
    } catch (error) {
      const message = error instanceof Error ? error.message : t("login.errors.generic");
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
            {t("login.registeredMessage")}
          </div>
        )}

        <label className="grid gap-2">
          <span className="text-sm font-semibold text-ink">{t("login.fields.email")}</span>
          <input
            {...register("email")}
            type="email"
            className="rounded-2xl border border-line bg-white px-4 py-3 outline-none focus:border-forest"
            placeholder={t("login.placeholders.email")}
          />
          {errors.email && <p className="text-sm text-danger">{errors.email.message}</p>}
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-semibold text-ink">{t("login.fields.password")}</span>
          <input
            {...register("password")}
            type="password"
            className="rounded-2xl border border-line bg-white px-4 py-3 outline-none focus:border-forest"
            placeholder={t("login.placeholders.password")}
          />
          {errors.password && <p className="text-sm text-danger">{errors.password.message}</p>}
        </label>

        {serverError && <p className="text-sm text-danger">{serverError}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-full bg-forest px-5 py-3 font-semibold text-white hover:bg-forest/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? t("login.submitBusy") : t("login.submitIdle")}
        </button>

        <p className="text-sm text-muted">
          {t("login.needAccount")}{" "}
          <Link href={localizeHref(locale, "/sign-up")} className="font-semibold text-forest hover:text-accent">
            {t("login.signUpLink")}
          </Link>
        </p>
      </div>
    </form>
  );
}
