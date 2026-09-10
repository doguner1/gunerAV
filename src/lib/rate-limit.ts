/**
 * Lightweight In-Memory Rate Limiter
 * Provides sliding-window flood protection against malicious bots or runaway client scripts.
 * Keys combine IP and visitor_id (`${ip}:${visitor_id}`) to prevent spoofing.
 */

interface RateLimitRecord {
  timestamps: number[];
  lastUpdated: number;
}

// Global in-memory storage (persists across warm serverless invocations)
const rateLimitStore = new Map<string, RateLimitRecord>();

let lastCleanup = Date.now();
const CLEANUP_INTERVAL_MS = 60 * 1000; // 1 minute

function cleanupStaleEntries(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  const expirationThreshold = now - windowMs * 2;
  for (const [key, record] of Array.from(rateLimitStore.entries())) {
    if (record.lastUpdated < expirationThreshold) {
      rateLimitStore.delete(key);
    }
  }
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number;
}

/**
 * Checks and records rate limit for a composite `${ip}:${visitor_id}` key.
 *
 * @param prefix Endpoint identifier (e.g., "collect", "heartbeat")
 * @param ip Client IP address
 * @param visitorId Client visitor UUID (optional)
 * @param maxRequests Maximum allowed requests within the time window
 * @param windowSeconds Window length in seconds
 */
export function checkRateLimit(
  prefix: string,
  ip: string,
  visitorId: string | null | undefined,
  maxRequests: number,
  windowSeconds: number
): RateLimitResult {
  const cleanIp = (ip || "unknown").split(",")[0].trim();
  const cleanVisitor = (visitorId || "anon").trim().slice(0, 64);
  const key = `${prefix}:${cleanIp}:${cleanVisitor}`;

  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const windowStart = now - windowMs;

  cleanupStaleEntries(windowMs);

  let record = rateLimitStore.get(key);
  if (!record) {
    record = { timestamps: [], lastUpdated: now };
    rateLimitStore.set(key, record);
  }

  // Filter out timestamps outside the active window
  record.timestamps = record.timestamps.filter((ts) => ts > windowStart);
  record.lastUpdated = now;

  if (record.timestamps.length >= maxRequests) {
    const oldestTimestamp = record.timestamps[0] || windowStart;
    const retryAfterSec = Math.max(1, Math.ceil((oldestTimestamp + windowMs - now) / 1000));
    return {
      success: false,
      remaining: 0,
      reset: retryAfterSec,
    };
  }

  // Allow request and record timestamp
  record.timestamps.push(now);

  return {
    success: true,
    remaining: Math.max(0, maxRequests - record.timestamps.length),
    reset: windowSeconds,
  };
}
