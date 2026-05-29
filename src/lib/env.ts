const publicSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publicSupabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const env = {
  publicSupabaseUrl,
  publicSupabaseAnonKey,
  paymentEmail: process.env.NEXT_PUBLIC_PAYMENT_EMAIL ?? "payments@americanoopen.com",
};

export function hasSupabaseEnv() {
  return Boolean(env.publicSupabaseUrl && env.publicSupabaseAnonKey);
}
