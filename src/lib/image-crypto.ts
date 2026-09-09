import crypto from "crypto";

const SECRET_SEED = process.env.IMAGE_PROXY_SECRET;

if (!SECRET_SEED) {
  throw new Error("IMAGE_PROXY_SECRET is not defined in environment variables. Critical security vulnerability.");
}

// Derive fixed 32-byte key for AES-256
const KEY = crypto.createHash("sha256").update(SECRET_SEED).digest();

/**
 * Encrypts an external image URL deterministically into a safe base64url token.
 * Deterministic encryption allows browser and CDN caching to work identically across requests.
 */
export function encryptImageUrl(url: string): string {
  if (!url || typeof url !== "string") return "";
  // Do not proxy local assets
  if (url.startsWith("/") && !url.startsWith("//")) return url;
  // Already proxied
  if (url.startsWith("/api/img")) return url;

  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return url;
  }

  try {
    // 12-byte deterministic IV derived from URL and secret
    const iv = crypto.createHmac("sha256", KEY).update(url).digest().subarray(0, 12);
    const cipher = crypto.createCipheriv("aes-256-gcm", KEY, iv);
    const encrypted = Buffer.concat([cipher.update(url, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag(); // 16 bytes

    // Combine: iv (12) + tag (16) + ciphertext
    const combined = Buffer.concat([iv, tag, encrypted]);
    return combined.toString("base64url");
  } catch (err) {
    console.error("[image-crypto] Encryption error:", err);
    return url;
  }
}

/**
 * Decrypts a token back to the original URL.
 * Returns null if invalid or tampered with.
 */
export function decryptImageUrl(token: string): string | null {
  if (!token || typeof token !== "string") return null;

  try {
    const buf = Buffer.from(token, "base64url");
    if (buf.length < 28) return null; // 12 iv + 16 tag minimum

    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const encrypted = buf.subarray(28);

    const decipher = crypto.createDecipheriv("aes-256-gcm", KEY, iv);
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    const url = decrypted.toString("utf8");

    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Transforms any image URL into a masked, encrypted proxy URL.
 * Example: https://www.avalemi.com/... -> /api/img?token=ab12...
 */
export function getSecureImageUrl(url: string | undefined | null): string {
  if (!url) return "/images/products/optics-1.webp";
  if (url.startsWith("/") && !url.startsWith("//")) return url;
  if (url.startsWith("/api/img")) return url;

  if (url.startsWith("http://") || url.startsWith("https://")) {
    const token = encryptImageUrl(url);
    return `/api/img?token=${token}&v=2`;
  }

  return url;
}
