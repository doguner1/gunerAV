import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { getSupabaseAdminClient } from "@/lib/server-supabase";
import { ContactMessage } from "@/types/message";

const MESSAGES_FILE_PATH = path.join(process.cwd(), "data", "messages.json");

/**
 * Safely reads messages from local JSON file
 */
async function readLocalMessages(): Promise<ContactMessage[]> {
  try {
    const raw = await fs.readFile(MESSAGES_FILE_PATH, "utf-8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Safely writes messages to local JSON file
 */
async function writeLocalMessages(messages: ContactMessage[]): Promise<void> {
  try {
    await fs.writeFile(MESSAGES_FILE_PATH, JSON.stringify(messages, null, 2), "utf-8");
  } catch (err) {
    // Vercel serverless environments have read-only filesystems in production
    // Supabase will persist the data.
  }
}

/**
 * Saves a new contact message using multi-tier storage:
 * 1. Supabase 'contact_messages' table
 * 2. Supabase 'analytics_events' table (fallback if contact_messages table is not yet created)
 * 3. Local data/messages.json
 */
export async function saveContactMessage(params: {
  name: string;
  phone: string;
  email?: string;
  subject: string;
  message: string;
  ip_hash?: string;
  user_agent?: string;
}): Promise<ContactMessage> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const newMessage: ContactMessage = {
    id,
    name: params.name.trim(),
    phone: params.phone.trim(),
    email: params.email?.trim() || "",
    subject: params.subject.trim() || "general",
    message: params.message.trim(),
    is_read: false,
    created_at: now,
    ip_hash: params.ip_hash,
    user_agent: params.user_agent,
  };

  const supabase = getSupabaseAdminClient();

  if (supabase) {
    let insertedInPrimary = false;

    // 1. Try dedicated contact_messages table
    try {
      const { error } = await supabase.from("contact_messages").insert({
        id: newMessage.id,
        name: newMessage.name,
        phone: newMessage.phone,
        email: newMessage.email || null,
        subject: newMessage.subject,
        message: newMessage.message,
        is_read: false,
        created_at: newMessage.created_at,
        ip_hash: newMessage.ip_hash || null,
        user_agent: newMessage.user_agent || null,
      });

      if (!error) {
        insertedInPrimary = true;
      } else {
        console.warn("[server-messages] contact_messages insert note:", error.message);
      }
    } catch (e) {
      console.warn("[server-messages] contact_messages table not ready, using fallback:", e);
    }

    // 2. Fallback to analytics_events if contact_messages table does not exist
    if (!insertedInPrimary) {
      try {
        await supabase.from("analytics_events").insert({
          event_type: "__contact_message__",
          product_name: newMessage.name,
          product_slug: newMessage.phone,
          category: newMessage.subject,
          search_term: newMessage.email || null,
          raw_params: newMessage,
          ip_hash: newMessage.ip_hash || null,
          user_agent: newMessage.user_agent || null,
        });
      } catch (e) {
        console.error("[server-messages] analytics_events fallback insert error:", e);
      }
    }
  }

  // 3. Local filesystem fallback/cache
  try {
    const local = await readLocalMessages();
    local.unshift(newMessage);
    await writeLocalMessages(local);
  } catch (err) {
    // Ignore local write failure in serverless
  }

  return newMessage;
}

/**
 * Retrieves all contact messages, merging Supabase and local sources,
 * sorted by date descending.
 */
export async function getContactMessages(): Promise<ContactMessage[]> {
  const messageMap = new Map<string, ContactMessage>();

  const supabase = getSupabaseAdminClient();

  if (supabase) {
    // 1. Read from dedicated contact_messages table
    try {
      const { data, error } = await supabase
        .from("contact_messages")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(300);

      if (!error && Array.isArray(data)) {
        for (const row of data) {
          if (row.id) {
            messageMap.set(String(row.id), {
              id: String(row.id),
              name: row.name || "",
              phone: row.phone || "",
              email: row.email || "",
              subject: row.subject || "general",
              message: row.message || "",
              is_read: Boolean(row.is_read),
              created_at: row.created_at || new Date().toISOString(),
              ip_hash: row.ip_hash,
              user_agent: row.user_agent,
            });
          }
        }
      }
    } catch {
      // Table might not exist yet
    }

    // 2. Read from analytics_events fallback table
    try {
      const { data, error } = await supabase
        .from("analytics_events")
        .select("*")
        .eq("event_type", "__contact_message__")
        .order("created_at", { ascending: false })
        .limit(300);

      if (!error && Array.isArray(data)) {
        for (const row of data) {
          const p = (row.raw_params && typeof row.raw_params === "object") ? row.raw_params : {};
          const msgId = p.id || String(row.id);
          if (msgId && !messageMap.has(msgId)) {
            messageMap.set(msgId, {
              id: msgId,
              name: p.name || row.product_name || "",
              phone: p.phone || row.product_slug || "",
              email: p.email || row.search_term || "",
              subject: p.subject || row.category || "general",
              message: p.message || "",
              is_read: Boolean(p.is_read),
              created_at: p.created_at || row.created_at || new Date().toISOString(),
              ip_hash: row.ip_hash,
              user_agent: row.user_agent,
            });
          }
        }
      }
    } catch (err) {
      console.warn("[server-messages] analytics_events read error:", err);
    }
  }

  // 3. Merge local file messages if any
  try {
    const local = await readLocalMessages();
    for (const msg of local) {
      if (msg.id && !messageMap.has(msg.id)) {
        messageMap.set(msg.id, msg);
      }
    }
  } catch {
    // Ignore
  }

  const all = Array.from(messageMap.values());
  all.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return all;
}

/**
 * Updates read status of a message
 */
export async function updateContactMessageReadStatus(id: string, is_read: boolean): Promise<boolean> {
  const supabase = getSupabaseAdminClient();
  let updated = false;

  if (supabase) {
    try {
      const { error } = await supabase
        .from("contact_messages")
        .update({ is_read })
        .eq("id", id);
      if (!error) updated = true;
    } catch {
      // Table might not exist
    }

    // Fallback update in analytics_events if stored there
    try {
      const { data } = await supabase
        .from("analytics_events")
        .select("id, raw_params")
        .eq("event_type", "__contact_message__");

      if (data && Array.isArray(data)) {
        for (const row of data) {
          const p = row.raw_params || {};
          if (p.id === id || String(row.id) === id) {
            await supabase
              .from("analytics_events")
              .update({
                raw_params: { ...p, is_read }
              })
              .eq("id", row.id);
            updated = true;
          }
        }
      }
    } catch {
      // Ignore
    }
  }

  // Also update local file
  try {
    const local = await readLocalMessages();
    const item = local.find((m) => m.id === id);
    if (item) {
      item.is_read = is_read;
      await writeLocalMessages(local);
      updated = true;
    }
  } catch {
    // Ignore
  }

  return updated;
}

/**
 * Deletes a contact message
 */
export async function deleteContactMessage(id: string): Promise<boolean> {
  const supabase = getSupabaseAdminClient();
  let deleted = false;

  if (supabase) {
    try {
      const { error } = await supabase
        .from("contact_messages")
        .delete()
        .eq("id", id);
      if (!error) deleted = true;
    } catch {
      // Ignore
    }

    // Fallback delete in analytics_events
    try {
      const { data } = await supabase
        .from("analytics_events")
        .select("id, raw_params")
        .eq("event_type", "__contact_message__");

      if (data && Array.isArray(data)) {
        for (const row of data) {
          const p = row.raw_params || {};
          if (p.id === id || String(row.id) === id) {
            await supabase
              .from("analytics_events")
              .delete()
              .eq("id", row.id);
            deleted = true;
          }
        }
      }
    } catch {
      // Ignore
    }
  }

  // Also delete from local file
  try {
    const local = await readLocalMessages();
    const filtered = local.filter((m) => m.id !== id);
    if (filtered.length !== local.length) {
      await writeLocalMessages(filtered);
      deleted = true;
    }
  } catch {
    // Ignore
  }

  return deleted;
}
