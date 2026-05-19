import { createClient } from "@supabase/supabase-js";

export function createSupabaseClient(locals?: Record<string, any>) {
  // Try Cloudflare runtime (locals.runtime.env), then locals directly, then import.meta.env
  const env = locals?.runtime?.env ?? locals?.env ?? locals ?? {};
  const url = env.SUPABASE_URL ?? import.meta.env.SUPABASE_URL;
  const key = env.SUPABASE_ANON_KEY ?? import.meta.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      `Missing Supabase config. URL: ${url ? "set" : "missing"}, Key: ${key ? "set" : "missing"}. ` +
      `Check your environment variables.`
    );
  }

  return createClient(url, key);
}
