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
import { slugify } from "@/lib/utils";

type SignUpValues = {
  displayName: string;
  username: string;
  email: string;
  password: string;
  phone?: string;
  category?: string;
};

export function SignUpForm({
  paymentEmail,
  enabled,
  locale,
}: {
  paymentEmail: string;
  enabled: boolean;
  locale: Locale;
}) {
  const router = useRouter();
  const { t } = useI18n();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const signUpSchema = z
    .object({
      displayName: z.string().min(2, t("signUp.errors.name")),
      username: z
        .string()
        .min(3, t("signUp.errors.usernameLength"))
        .regex(/^[a-z0-9-]+$/, t("signUp.errors.usernameFormat")),
      email: z.email(t("signUp.errors.email")),
      password: z.string().min(8, t("signUp.errors.password")),
      phone: z.string().optional(),
      category: z.string().optional(),
    })
    .transform((data) => ({
      ...data,
      username: slugify(data.username),
    }));
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
  });

  async function onSubmit(values: SignUpValues) {
    if (!enabled) {
      setServerError(t("signUp.errors.supabase"));
      return;
    }

    setServerError(null);
    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const parsed = signUpSchema.parse(values);

      const { error } = await supabase.auth.signUp({
        email: parsed.email,
        password: parsed.password,
        options: {
          data: {
            display_name: parsed.displayName,
            username: parsed.username,
            phone: parsed.phone,
            category: parsed.category,
          },
        },
      });

      if (error) {
        setServerError(error.message);
        return;
      }

      router.push(
        `${localizeHref(locale, "/login")}?registered=1&email=${encodeURIComponent(parsed.email)}`,
      );
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : t("signUp.errors.generic");
      setServerError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="card rounded-[2rem] p-6 sm:p-8">
      <div className="grid gap-5">
        <label className="grid gap-2">
          <span className="text-sm font-semibold text-ink">{t("signUp.fields.displayName")}</span>
          <input
            {...register("displayName")}
            className="rounded-2xl border border-line bg-white px-4 py-3 outline-none focus:border-forest"
            placeholder={t("signUp.placeholders.displayName")}
          />
          {errors.displayName && <p className="text-sm text-danger">{errors.displayName.message}</p>}
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-semibold text-ink">{t("signUp.fields.username")}</span>
          <input
            {...register("username")}
            className="rounded-2xl border border-line bg-white px-4 py-3 outline-none focus:border-forest"
            placeholder={t("signUp.placeholders.username")}
          />
          {errors.username && <p className="text-sm text-danger">{errors.username.message}</p>}
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-semibold text-ink">{t("signUp.fields.email")}</span>
          <input
            {...register("email")}
            type="email"
            className="rounded-2xl border border-line bg-white px-4 py-3 outline-none focus:border-forest"
            placeholder={t("signUp.placeholders.email")}
          />
          {errors.email && <p className="text-sm text-danger">{errors.email.message}</p>}
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-semibold text-ink">{t("signUp.fields.password")}</span>
          <input
            {...register("password")}
            type="password"
            className="rounded-2xl border border-line bg-white px-4 py-3 outline-none focus:border-forest"
            placeholder={t("signUp.placeholders.password")}
          />
          {errors.password && <p className="text-sm text-danger">{errors.password.message}</p>}
        </label>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-ink">{t("signUp.fields.phone")}</span>
            <input
              {...register("phone")}
              className="rounded-2xl border border-line bg-white px-4 py-3 outline-none focus:border-forest"
              placeholder={t("signUp.placeholders.phone")}
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-ink">{t("signUp.fields.category")}</span>
            <select
              {...register("category")}
              className="rounded-2xl border border-line bg-white px-4 py-3 outline-none focus:border-forest"
            >
              <option value="">{t("common.levels.select")}</option>
              <option value="Beginner">{t("common.levels.beginner")}</option>
              <option value="Intermediate">{t("common.levels.intermediate")}</option>
              <option value="Advanced">{t("common.levels.advanced")}</option>
            </select>
          </label>
        </div>

        <div className="rounded-2xl bg-forest-soft px-4 py-4 text-sm leading-6 text-forest">
          {t("signUp.paymentNotice", { paymentEmail })}{" "}
        </div>

        {serverError && <p className="text-sm text-danger">{serverError}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-full bg-accent px-5 py-3 font-semibold text-white hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? t("signUp.submitBusy") : t("signUp.submitIdle")}
        </button>

        <p className="text-sm text-muted">
          {t("signUp.haveAccount")}{" "}
          <Link href={localizeHref(locale, "/login")} className="font-semibold text-forest hover:text-accent">
            {t("signUp.loginLink")}
          </Link>
        </p>
      </div>
    </form>
  );
}
