import { getSupabaseAdminClient } from "@/lib/server-supabase";

export interface StoredActiveVisitor {
  visitor_id: string;
  path: string;
  device_type: string;
  product_name: string | null;
  last_seen: string;
}

export async function recordActiveVisitor(params: {
  visitor_id: string;
  path?: string;
  device_type?: string;
  product_name?: string | null;
}) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    console.error("[active-visitors] Supabase client yok, heartbeat kaydedilemedi");
    return null;
  }
  const { error } = await supabase.from("active_visitors").upsert(
    {
      visitor_id: params.visitor_id,
      path: params.path || "/",
      device_type: params.device_type || "desktop",
      product_name: params.product_name || null,
      last_seen: new Date().toISOString(),
    },
    { onConflict: "visitor_id" }
  );
  if (error) console.error("[active-visitors upsert error]:", error.message);
  return !error;
}

export async function getActiveVisitors(windowMs = 45000): Promise<StoredActiveVisitor[]> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return [];
  const cutoff = new Date(Date.now() - windowMs).toISOString();
  const { data, error } = await supabase
    .from("active_visitors")
    .select("visitor_id, path, device_type, product_name, last_seen")
    .gte("last_seen", cutoff)
    .order("last_seen", { ascending: false })
    .limit(200);
  if (error) {
    console.error("[active-visitors select error]:", error.message);
    return [];
  }
  return data || [];
}
