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

type SignUpValues = {
  playerOneName: string;
  playerTwoName: string;
  email: string;
  confirmEmail: string;
  password: string;
  confirmPassword: string;
  phone?: string;
  category?: string;
};

export function SignUpForm({
  paymentAlias,
  contactEmail,
  enabled,
  locale,
}: {
  paymentAlias: string;
  contactEmail: string;
  enabled: boolean;
  locale: Locale;
}) {
  const router = useRouter();
  const { t } = useI18n();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const signUpSchema = z
    .object({
      playerOneName: z.string().min(2, t("signUp.errors.nameLength")),
      playerTwoName: z.string().min(2, t("signUp.errors.nameLength")),
      email: z.email(t("signUp.errors.email")),
      confirmEmail: z.email(t("signUp.errors.email")),
      password: z.string().min(8, t("signUp.errors.password")),
      confirmPassword: z.string().min(8, t("signUp.errors.password")),
      phone: z.string().optional(),
      category: z.string().optional(),
    })
    .refine((data) => data.email === data.confirmEmail, {
      message: t("signUp.errors.emailMatch"),
      path: ["confirmEmail"],
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("signUp.errors.passwordMatch"),
      path: ["confirmPassword"],
    });
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
            player_one_name: parsed.playerOneName.trim(),
            player_two_name: parsed.playerTwoName.trim(),
            phone: parsed.phone,
            category: parsed.category,
          },
        },
      });

      if (error) {
        setServerError(error.message);
        return;
      }

      router.push(localizeHref(locale, "/sign-up/success"));
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : t("signUp.errors.generic");
      setServerError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="card rounded-[1.6rem] p-3.5 sm:rounded-[2rem] sm:p-8">
      <div className="grid gap-3 sm:gap-5">
        <label className="grid gap-1.5 sm:gap-2">
          <span className="text-sm font-semibold text-ink">{t("signUp.fields.playerOneName")}</span>
          <input
            {...register("playerOneName")}
            className="rounded-[1.15rem] border border-line bg-white px-3.5 py-2 text-sm outline-none focus:border-forest sm:rounded-2xl sm:px-4 sm:py-3 sm:text-base"
            placeholder={t("signUp.placeholders.playerOneName")}
          />
          {errors.playerOneName && <p className="text-sm text-danger">{errors.playerOneName.message}</p>}
        </label>

        <label className="grid gap-1.5 sm:gap-2">
          <span className="text-sm font-semibold text-ink">{t("signUp.fields.playerTwoName")}</span>
          <input
            {...register("playerTwoName")}
            className="rounded-[1.15rem] border border-line bg-white px-3.5 py-2 text-sm outline-none focus:border-forest sm:rounded-2xl sm:px-4 sm:py-3 sm:text-base"
            placeholder={t("signUp.placeholders.playerTwoName")}
          />
          {errors.playerTwoName && <p className="text-sm text-danger">{errors.playerTwoName.message}</p>}
        </label>

        <label className="grid gap-1.5 sm:gap-2">
          <span className="text-sm font-semibold text-ink">{t("signUp.fields.email")}</span>
          <input
            {...register("email")}
            type="email"
            className="rounded-[1.15rem] border border-line bg-white px-3.5 py-2 text-sm outline-none focus:border-forest sm:rounded-2xl sm:px-4 sm:py-3 sm:text-base"
            placeholder={t("signUp.placeholders.email")}
          />
          {errors.email && <p className="text-sm text-danger">{errors.email.message}</p>}
        </label>

        <label className="grid gap-1.5 sm:gap-2">
          <span className="text-sm font-semibold text-ink">{t("signUp.fields.confirmEmail")}</span>
          <input
            {...register("confirmEmail")}
            type="email"
            className="rounded-[1.15rem] border border-line bg-white px-3.5 py-2 text-sm outline-none focus:border-forest sm:rounded-2xl sm:px-4 sm:py-3 sm:text-base"
            placeholder={t("signUp.placeholders.confirmEmail")}
          />
          {errors.confirmEmail && <p className="text-sm text-danger">{errors.confirmEmail.message}</p>}
        </label>

        <label className="grid gap-1.5 sm:gap-2">
          <span className="text-sm font-semibold text-ink">{t("signUp.fields.password")}</span>
          <input
            {...register("password")}
            type="password"
            className="rounded-[1.15rem] border border-line bg-white px-3.5 py-2 text-sm outline-none focus:border-forest sm:rounded-2xl sm:px-4 sm:py-3 sm:text-base"
            placeholder={t("signUp.placeholders.password")}
          />
          {errors.password && <p className="text-sm text-danger">{errors.password.message}</p>}
        </label>

        <label className="grid gap-1.5 sm:gap-2">
          <span className="text-sm font-semibold text-ink">{t("signUp.fields.confirmPassword")}</span>
          <input
            {...register("confirmPassword")}
            type="password"
            className="rounded-[1.15rem] border border-line bg-white px-3.5 py-2 text-sm outline-none focus:border-forest sm:rounded-2xl sm:px-4 sm:py-3 sm:text-base"
            placeholder={t("signUp.placeholders.confirmPassword")}
          />
          {errors.confirmPassword && (
            <p className="text-sm text-danger">{errors.confirmPassword.message}</p>
          )}
        </label>

        <div className="grid gap-3 sm:grid-cols-2 sm:gap-5">
          <label className="grid gap-1.5 sm:gap-2">
            <span className="text-sm font-semibold text-ink">{t("signUp.fields.phone")}</span>
            <input
              {...register("phone")}
              className="rounded-[1.15rem] border border-line bg-white px-3.5 py-2 text-sm outline-none focus:border-forest sm:rounded-2xl sm:px-4 sm:py-3 sm:text-base"
              placeholder={t("signUp.placeholders.phone")}
            />
          </label>
          <label className="grid gap-1.5 sm:gap-2">
            <span className="text-sm font-semibold text-ink">{t("signUp.fields.category")}</span>
            <select
              {...register("category")}
              className="rounded-[1.15rem] border border-line bg-white px-3.5 py-2 text-sm outline-none focus:border-forest sm:rounded-2xl sm:px-4 sm:py-3 sm:text-base"
            >
              <option value="">{t("common.levels.select")}</option>
              <option value="Beginner">{t("common.levels.beginner")}</option>
              <option value="Intermediate">{t("common.levels.intermediate")}</option>
              <option value="Advanced">{t("common.levels.advanced")}</option>
            </select>
          </label>
        </div>

        <div className="rounded-[1.15rem] bg-forest-soft px-3.5 py-3 text-sm leading-5.5 text-forest sm:rounded-2xl sm:px-4 sm:py-4 sm:leading-6">
          <div className="flex items-start gap-2.5">
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-forest text-[0.7rem] font-black text-white">
              !
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-forest">
                {t("signUp.important")}
              </p>
              <p className="mt-1">{t("signUp.paymentNotice", { paymentAlias, contactEmail })}</p>
            </div>
          </div>
        </div>

        {serverError && <p className="text-sm text-danger">{serverError}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-60 sm:px-5 sm:py-3 sm:text-base"
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
