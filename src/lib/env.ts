const publicSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publicSupabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const env = {
  publicSupabaseUrl,
  publicSupabaseAnonKey,
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "tusamericanos@gmail.com",
  paymentAlias: process.env.NEXT_PUBLIC_PAYMENT_ALIAS ?? "mili.lera.2006",
  paymentLink: "https://mpago.la/1pMWLSB",
};

export function hasSupabaseEnv() {
  return Boolean(env.publicSupabaseUrl && env.publicSupabaseAnonKey);
}
