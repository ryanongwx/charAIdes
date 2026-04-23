import { Router, Request, Response } from "express";
import { consumeLimit, peekLimit, getClientKey } from "../lib/gameLimiter";

const router = Router();

/**
 * POST /api/start-game
 *
 * Consumes one game from the caller's daily quota.
 * - 200 { used, limit, remaining, resetAt } on success
 * - 429 { error, used, limit, remaining, resetAt, retryAfterMs } when capped
 *
 * The client must call this successfully before starting any new round
 * (word bank, Daily, or AI Word). If the response is 429 the client should
 * surface the friendly limit-reached UI and not start the round.
 */
router.post("/", (req: Request, res: Response) => {
  const key = getClientKey(req);
  const { allowed, state } = consumeLimit(key);

  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Games-Limit", String(state.limit));
  res.setHeader("X-Games-Remaining", String(state.remaining));
  res.setHeader("X-Games-Reset-At", String(state.resetAt));

  if (!allowed) {
    const retryAfterMs = Math.max(0, state.resetAt - Date.now());
    res.setHeader("Retry-After", String(Math.ceil(retryAfterMs / 1000)));
    return res.status(429).json({
      error: "Daily game limit reached.",
      used: state.used,
      limit: state.limit,
      remaining: state.remaining,
      resetAt: state.resetAt,
      retryAfterMs,
    });
  }

  return res.json({
    used: state.used,
    limit: state.limit,
    remaining: state.remaining,
    resetAt: state.resetAt,
  });
});

/**
 * GET /api/start-game/status
 * Read-only view of the caller's current quota. Does not consume.
 */
router.get("/status", (req: Request, res: Response) => {
  const key = getClientKey(req);
  const state = peekLimit(key);
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Games-Limit", String(state.limit));
  res.setHeader("X-Games-Remaining", String(state.remaining));
  res.setHeader("X-Games-Reset-At", String(state.resetAt));
  res.json({
    used: state.used,
    limit: state.limit,
    remaining: state.remaining,
    resetAt: state.resetAt,
  });
});

export default router;
