export interface ContactMessage {
  id: string;
  name: string;
  phone: string;
  email?: string;
  subject: "general" | "product" | "license" | string;
  message: string;
  is_read: boolean;
  created_at: string;
  ip_hash?: string;
  user_agent?: string;
}
