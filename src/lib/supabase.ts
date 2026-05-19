import { createClient } from "@supabase/supabase-js";

let envModule: Record<string, string> | null = null;

async function getEnv() {
  if (envModule) return envModule;
  try {
    const mod = await import("cloudflare:workers");
    envModule = mod.env as Record<string, string>;
    return envModule;
  } catch {
    // Not running on Cloudflare, fall back to import.meta.env
    return import.meta.env;
  }
}

export async function createSupabaseClient() {
  const env = await getEnv();
  const url = env.SUPABASE_URL;
  const key = env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      `Missing Supabase config. URL: ${url ? "set" : "missing"}, Key: ${key ? "set" : "missing"}. ` +
      `Check your environment variables.`
    );
  }

  return createClient(url, key);
}
