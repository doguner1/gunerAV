import { NextRequest } from "next/server";
import crypto from "crypto";

const SESSION_COOKIE_NAME = "gunerav_admin_token";
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8 saat
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000; // 5 dakika
const MAX_FAILED_ATTEMPTS = 5;

// In-memory rate limiting map for login attempts: ip -> { count, resetAt }
const loginRateLimit = new Map<string, { count: number; resetAt: number }>();

/**
 * Constant-time comparison to prevent timing attacks
 */
export function verifyPassword(inputPassword: string): boolean {
  const secret = process.env.ANALYTICS_SECRET;
  if (!secret || !inputPassword) return false;

  const inputBuf = Buffer.from(inputPassword);
  const secretBuf = Buffer.from(secret);

  if (inputBuf.length !== secretBuf.length) {
    // Keep timing uniform
    crypto.timingSafeEqual(inputBuf, inputBuf);
    return false;
  }

  return crypto.timingSafeEqual(inputBuf, secretBuf);
}

/**
 * Check if IP exceeded brute-force limit
 */
export function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetInSec: number } {
  const now = Date.now();
  const entry = loginRateLimit.get(ip);

  if (!entry || now > entry.resetAt) {
    return { allowed: true, remaining: MAX_FAILED_ATTEMPTS, resetInSec: 0 };
  }

  if (entry.count >= MAX_FAILED_ATTEMPTS) {
    return {
      allowed: false,
      remaining: 0,
      resetInSec: Math.ceil((entry.resetAt - now) / 1000),
    };
  }

  return {
    allowed: true,
    remaining: MAX_FAILED_ATTEMPTS - entry.count,
    resetInSec: Math.ceil((entry.resetAt - now) / 1000),
  };
}

/**
 * Register a failed login attempt for rate limiting
 */
export function registerFailedAttempt(ip: string): void {
  const now = Date.now();
  const entry = loginRateLimit.get(ip);

  if (!entry || now > entry.resetAt) {
    loginRateLimit.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
  } else {
    entry.count += 1;
  }
}

/**
 * Clear rate limit on successful authentication
 */
export function clearRateLimit(ip: string): void {
  loginRateLimit.delete(ip);
}

/**
 * Generates a stateless signed session token (HMAC-SHA256) valid for 8 hours.
 * Format: expiresAt.randomBytes.signature
 */
export function createSessionToken(): string {
  const secret = process.env.ANALYTICS_SECRET || "gunerav_default_secret_key";
  const expiresAt = Date.now() + SESSION_DURATION_MS;
  const nonce = crypto.randomBytes(16).toString("hex");
  const payload = `${expiresAt}.${nonce}`;
  const signature = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return `${payload}.${signature}`;
}

/**
 * Verifies the stateless session token and ensures it has not expired.
 */
export function verifySessionToken(token: string): boolean {
  if (!token) return false;
  const secret = process.env.ANALYTICS_SECRET || "gunerav_default_secret_key";
  const parts = token.split(".");
  if (parts.length !== 3) return false;

  const [expiresAtStr, nonce, receivedSig] = parts;
  const expiresAt = parseInt(expiresAtStr, 10);
  if (isNaN(expiresAt) || Date.now() > expiresAt) {
    return false;
  }

  const payload = `${expiresAtStr}.${nonce}`;
  const expectedSig = crypto.createHmac("sha256", secret).update(payload).digest("hex");

  const receivedBuf = Buffer.from(receivedSig);
  const expectedBuf = Buffer.from(expectedSig);

  if (receivedBuf.length !== expectedBuf.length) return false;
  return crypto.timingSafeEqual(receivedBuf, expectedBuf);
}

/**
 * Checks if the request comes from an authenticated admin user.
 * Supports:
 * 1. gunerav_admin_token HTTP cookie
 * 2. x-admin-key header (direct password or token)
 * 3. Authorization: Bearer <token>
 * 4. ?key= query parameter (legacy fallback)
 */
export function isAdminAuthorized(req: NextRequest): boolean {
  // 1. Session Cookie
  const cookieToken = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (cookieToken && verifySessionToken(cookieToken)) {
    return true;
  }

  // 2. x-admin-key Header
  const headerKey = req.headers.get("x-admin-key");
  if (headerKey) {
    if (verifySessionToken(headerKey) || verifyPassword(headerKey)) {
      return true;
    }
  }

  // 3. Authorization Header
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const bearer = authHeader.substring(7).trim();
    if (verifySessionToken(bearer) || verifyPassword(bearer)) {
      return true;
    }
  }

  // 4. Query param fallback (?key=...)
  const { searchParams } = new URL(req.url);
  const queryKey = searchParams.get("key");
  if (queryKey && (verifyPassword(queryKey) || verifySessionToken(queryKey))) {
    return true;
  }

  return false;
}

export { SESSION_COOKIE_NAME, SESSION_DURATION_MS };
