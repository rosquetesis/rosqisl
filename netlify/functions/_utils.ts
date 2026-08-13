/**
 * Shared utilities for all Netlify Functions
 * Security: input sanitization, CORS headers, Supabase client factory
 */
import { createClient } from '@supabase/supabase-js';

// ─── Security Headers ───────────────────────────────────────────────────────
export const SECURITY_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': process.env.URL || '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Type': 'application/json',
};

export const jsonResponse = (statusCode: number, body: unknown) => ({
  statusCode,
  headers: SECURITY_HEADERS,
  body: JSON.stringify(body),
});

export const optionsResponse = () => ({
  statusCode: 204,
  headers: SECURITY_HEADERS,
  body: '',
});

// ─── Supabase Admin Client (uses Service Role Key — never exposed to browser) ─
// Dummy WebSocket for Node 18 (Netlify Functions) — Supabase Realtime requires it
// but we never use Realtime in serverless, so this no-op class satisfies the check.
class NoopWebSocket {
  static CONNECTING = 0; static OPEN = 1; static CLOSING = 2; static CLOSED = 3;
  readyState = 3;
  constructor() {}
  send() {}
  close() {}
  addEventListener() {}
  removeEventListener() {}
}

// Inject into globalThis if missing so Supabase Realtime doesn't throw
if (typeof globalThis.WebSocket === 'undefined') {
  (globalThis as any).WebSocket = NoopWebSocket;
}

export function getSupabaseAdmin() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
  if (!url || !key) {
    throw new Error('Supabase not configured: missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    db: { schema: 'public' },
  });
}

// ─── Input Sanitization ──────────────────────────────────────────────────────

/** Strip HTML tags and control characters from a string */
export function sanitizeStr(value: unknown, maxLength = 500): string {
  if (typeof value !== 'string') return '';
  return value
    .replace(/<[^>]*>/g, '')           // strip HTML tags
    .replace(/[<>"'`]/g, '')           // strip remaining dangerous chars
    .trim()
    .slice(0, maxLength);
}

/** Sanitize an image URL or Base64 string (allows much larger lengths) */
export function sanitizeImage(value: unknown): string {
  if (typeof value !== 'string') return '';
  // Max ~7MB for base64 images (5MB image + base64 overhead)
  const maxLength = 7000000;
  return value
    .replace(/<[^>]*>/g, '')
    .replace(/[<>"'`]/g, '')
    .trim()
    .slice(0, maxLength);
}

/** Parse a safe positive number, returns 0 if invalid */
export function sanitizeNum(value: unknown): number {
  const n = parseFloat(String(value));
  return isFinite(n) && n >= 0 ? Math.round(n * 1000) / 1000 : 0;
}

/** Parse a safe integer, returns 0 if invalid */
export function sanitizeInt(value: unknown): number {
  const n = parseInt(String(value), 10);
  return isFinite(n) && n >= 0 ? n : 0;
}

/** Validate that an ID looks safe (alphanumeric + dash/underscore) */
export function isSafeId(id: unknown): boolean {
  return typeof id === 'string' && /^[a-zA-Z0-9_\-]{1,120}$/.test(id);
}

/** Pick only allowed keys from an object (whitelist) */
export function pickAllowed<T extends object>(
  obj: Record<string, unknown>,
  allowedKeys: (keyof T)[]
): Partial<T> {
  const result: Partial<T> = {};
  for (const key of allowedKeys) {
    if (key in obj) {
      (result as Record<string, unknown>)[key as string] = obj[key as string];
    }
  }
  return result;
}

// ─── BCV Rate Parser ─────────────────────────────────────────────────────────
export function parseBCVRate(rawStr: string): number {
  if (!rawStr) return 0;
  const s = String(rawStr).trim();
  // European format: comma = decimal, dot = thousand separator
  if (s.includes(',')) {
    const normalized = s.replace(/\./g, '').replace(',', '.');
    const val = parseFloat(normalized);
    return isNaN(val) ? 0 : val;
  }
  const val = parseFloat(s);
  return isNaN(val) ? 0 : val;
}
