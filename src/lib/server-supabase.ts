import { createClient, SupabaseClient } from "@supabase/supabase-js";
import crypto from "crypto";

let cachedClient: SupabaseClient | null = null;

export function getSupabaseAdminClient(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY; // SADECE bu — başka fallback YOK

  if (!url || !key) {
    console.error(
      "[server-supabase] SUPABASE_SERVICE_ROLE_KEY veya URL tanımlı değil! " +
      "Vercel Environment Variables ayarlarını kontrol et."
    );
    return null;
  }

  if (!cachedClient) {
    cachedClient = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return cachedClient;
}

/**
 * KVKK: Hash client IP address using SHA-256 with optional salt.
 * Never stores raw IP in production.
 */
export function hashIp(ip: string): string {
  if (!ip || ip === "unknown") return "unknown";
  const salt = process.env.IP_HASH_SALT || "gunerav_production_salt_2026";
  return crypto.createHash("sha256").update(ip + salt).digest("hex");
}
