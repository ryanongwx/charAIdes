import type { Request } from "express";

/**
 * Simple in-memory per-IP daily game counter.
 *
 * - Window is a rolling 24 hours (first consumed game starts the window).
 * - When the window expires the count resets on the next call.
 * - Process-local only: counters are lost on restart. That's intentional for
 *   a single-instance deployment; if you run multiple instances behind a load
 *   balancer, swap this out for Redis (or use a store like `rate-limit-redis`).
 */

const WINDOW_MS = 24 * 60 * 60 * 1000;

export interface LimitState {
  used: number;
  limit: number;
  remaining: number;
  resetAt: number; // epoch ms
}

interface Entry {
  count: number;
  windowStart: number;
}

const store = new Map<string, Entry>();

function getLimit(): number {
  const raw = Number(process.env.GAMES_PER_DAY);
  if (Number.isFinite(raw) && raw > 0) return Math.floor(raw);
  return 3;
}

export function getClientKey(req: Request): string {
  // `app.set("trust proxy", 1)` is enabled in index.ts, so req.ip is the
  // x-forwarded-for-derived client address when behind a proxy.
  return req.ip ?? req.socket.remoteAddress ?? "unknown";
}

function snapshot(entry: Entry | undefined, limit: number): LimitState {
  const now = Date.now();
  if (!entry || now - entry.windowStart >= WINDOW_MS) {
    return {
      used: 0,
      limit,
      remaining: limit,
      resetAt: now + WINDOW_MS,
    };
  }
  const remaining = Math.max(0, limit - entry.count);
  return {
    used: entry.count,
    limit,
    remaining,
    resetAt: entry.windowStart + WINDOW_MS,
  };
}

export function peekLimit(key: string): LimitState {
  return snapshot(store.get(key), getLimit());
}

/**
 * Attempt to consume one game from the given client's daily quota.
 * Returns the post-consume state if allowed (remaining is decremented),
 * or the current state unchanged (with allowed=false) if the cap is hit.
 */
export function consumeLimit(
  key: string
): { allowed: boolean; state: LimitState } {
  const limit = getLimit();
  const now = Date.now();
  const existing = store.get(key);

  // No entry or expired window → start a fresh window, consume 1.
  if (!existing || now - existing.windowStart >= WINDOW_MS) {
    const fresh: Entry = { count: 1, windowStart: now };
    store.set(key, fresh);
    return {
      allowed: true,
      state: {
        used: 1,
        limit,
        remaining: Math.max(0, limit - 1),
        resetAt: now + WINDOW_MS,
      },
    };
  }

  if (existing.count >= limit) {
    return { allowed: false, state: snapshot(existing, limit) };
  }

  existing.count += 1;
  return { allowed: true, state: snapshot(existing, limit) };
}

/**
 * Periodically evict expired entries so the Map doesn't grow unbounded.
 * Safe to call from a setInterval; cheap O(n) sweep.
 */
export function sweepExpired(): void {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now - entry.windowStart >= WINDOW_MS) {
      store.delete(key);
    }
  }
}

/** Test hook – not exported from the route layer. */
export function _resetLimiterForTests(): void {
  store.clear();
}
