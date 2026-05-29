"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { createClient } from "@/lib/supabase/browser";
import { slugify } from "@/lib/utils";

const signUpSchema = z
  .object({
    displayName: z.string().min(2, "Please add your name."),
    username: z
      .string()
      .min(3, "Choose at least 3 characters.")
      .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers, and dashes only."),
    email: z.email("Use a valid email."),
    password: z.string().min(8, "Use at least 8 characters."),
    phone: z.string().optional(),
    category: z.string().optional(),
  })
  .transform((data) => ({
    ...data,
    username: slugify(data.username),
  }));

type SignUpValues = z.input<typeof signUpSchema>;

export function SignUpForm({ paymentEmail, enabled }: { paymentEmail: string; enabled: boolean }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
  });

  async function onSubmit(values: SignUpValues) {
    if (!enabled) {
      setServerError("Supabase is not configured yet. Add the environment variables to enable real signups.");
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

      router.push(`/login?registered=1&email=${encodeURIComponent(parsed.email)}`);
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Signup failed.";
      setServerError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="card rounded-[2rem] p-6 sm:p-8">
      <div className="grid gap-5">
        <label className="grid gap-2">
          <span className="text-sm font-semibold text-ink">Display name</span>
          <input
            {...register("displayName")}
            className="rounded-2xl border border-line bg-white px-4 py-3 outline-none focus:border-forest"
            placeholder="Sofia Rojas"
          />
          {errors.displayName && <p className="text-sm text-danger">{errors.displayName.message}</p>}
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-semibold text-ink">Username</span>
          <input
            {...register("username")}
            className="rounded-2xl border border-line bg-white px-4 py-3 outline-none focus:border-forest"
            placeholder="sofi-topspin"
          />
          {errors.username && <p className="text-sm text-danger">{errors.username.message}</p>}
        </label>

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
            placeholder="8+ characters"
          />
          {errors.password && <p className="text-sm text-danger">{errors.password.message}</p>}
        </label>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-ink">Phone</span>
            <input
              {...register("phone")}
              className="rounded-2xl border border-line bg-white px-4 py-3 outline-none focus:border-forest"
              placeholder="+54 11 ..."
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-ink">Category</span>
            <select
              {...register("category")}
              className="rounded-2xl border border-line bg-white px-4 py-3 outline-none focus:border-forest"
            >
              <option value="">Select level</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </label>
        </div>

        <div className="rounded-2xl bg-forest-soft px-4 py-4 text-sm leading-6 text-forest">
          After signup, send your payment proof to <span className="font-bold">{paymentEmail}</span>.
          An admin will confirm it and approve your entry.
        </div>

        {serverError && <p className="text-sm text-danger">{serverError}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-full bg-accent px-5 py-3 font-semibold text-white hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Creating account..." : "Create account"}
        </button>

        <p className="text-sm text-muted">
          Already signed up?{" "}
          <Link href="/login" className="font-semibold text-forest hover:text-accent">
            Log in
          </Link>
        </p>
      </div>
    </form>
  );
}
