import "server-only";

import { createClient } from "@supabase/supabase-js";
import { env, hasSupabaseEnv } from "@/lib/env";

let adminClient: ReturnType<typeof createClient> | null = null;

export function hasSupabaseAdminEnv() {
  return Boolean(hasSupabaseEnv() && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function createAdminClient() {
  if (!hasSupabaseAdminEnv()) {
    throw new Error("Supabase admin environment variables are missing.");
  }

  if (!adminClient) {
    adminClient = createClient(env.publicSupabaseUrl!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return adminClient;
}
