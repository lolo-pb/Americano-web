"use client";

import { createBrowserClient } from "@supabase/ssr";
import { env, hasSupabaseEnv } from "@/lib/env";

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (!hasSupabaseEnv()) {
    throw new Error("Supabase environment variables are missing.");
  }

  if (!browserClient) {
    browserClient = createBrowserClient(
      env.publicSupabaseUrl!,
      env.publicSupabaseAnonKey!,
    );
  }

  return browserClient;
}
