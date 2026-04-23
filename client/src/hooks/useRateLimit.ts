import { useCallback, useEffect, useState } from "react";
import { apiUrl } from "../lib/api";

export interface RateLimitState {
  used: number;
  limit: number;
  remaining: number;
  resetAt: number;
}

export class RateLimitExceededError extends Error {
  state: RateLimitState;
  retryAfterMs: number;
  constructor(state: RateLimitState, retryAfterMs: number) {
    super("Daily game limit reached.");
    this.name = "RateLimitExceededError";
    this.state = state;
    this.retryAfterMs = retryAfterMs;
  }
}

/**
 * Client-side rate-limit hook for the 3-games-per-day quota.
 *
 * - `state` reflects the most recent known quota snapshot (from peek or consume).
 * - `refresh` does a read-only GET that updates state without consuming.
 * - `consume` does the authoritative POST; throws RateLimitExceededError on 429.
 */
export function useRateLimit() {
  const [state, setState] = useState<RateLimitState | null>(null);

  const refresh = useCallback(async (): Promise<RateLimitState | null> => {
    try {
      const res = await fetch(apiUrl("/api/start-game/status"));
      if (!res.ok) return null;
      const json = (await res.json()) as RateLimitState;
      setState(json);
      return json;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const consume = useCallback(async (): Promise<RateLimitState> => {
    const res = await fetch(apiUrl("/api/start-game"), { method: "POST" });

    let body: Partial<RateLimitState> & { retryAfterMs?: number; error?: string } = {};
    try {
      body = await res.json();
    } catch {
      // If the server didn't return JSON we still want a sensible error path.
    }

    if (res.status === 429) {
      const snapshot: RateLimitState = {
        used: body.used ?? 0,
        limit: body.limit ?? 0,
        remaining: body.remaining ?? 0,
        resetAt: body.resetAt ?? Date.now(),
      };
      setState(snapshot);
      throw new RateLimitExceededError(snapshot, body.retryAfterMs ?? 0);
    }

    if (!res.ok) {
      throw new Error(body.error ?? `Failed to start game (${res.status})`);
    }

    const snapshot: RateLimitState = {
      used: body.used ?? 0,
      limit: body.limit ?? 0,
      remaining: body.remaining ?? 0,
      resetAt: body.resetAt ?? Date.now(),
    };
    setState(snapshot);
    return snapshot;
  }, []);

  return { state, refresh, consume };
}

/** Format a ms duration as "Xh Ym" or "Ym" for UI display. */
export function formatDuration(ms: number): string {
  const totalMinutes = Math.max(0, Math.ceil(ms / 60_000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours <= 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}
