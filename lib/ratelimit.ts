import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { tooManyRequests } from "./errors";

export const writeLimiter = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "60 s"),
  prefix: "alumni:write",
  ephemeralCache: new Map(),
});

export const aiLimiter = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(20, "1 h"),
  prefix: "alumni:ai",
  ephemeralCache: new Map(),
});

export const guestAiLimiter = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "1 h"),
  prefix: "alumni:guest-ai",
  ephemeralCache: new Map(),
});

export const adminLimiter = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, "1 h"),
  prefix: "alumni:admin",
  ephemeralCache: new Map(),
});

export const contactLimiter = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "1 h"),
  prefix: "alumni:contact",
  ephemeralCache: new Map(),
});

type RateLimiter = {
  limit: (identifier: string) => Promise<{ success: boolean; reset: number }>;
};

export async function applyRateLimit(
  limiter: RateLimiter,
  identifier: string
): Promise<Response | null> {
  try {
    const { success, reset } = await limiter.limit(identifier);
    if (!success) {
      const retryAfter = Math.ceil((reset - Date.now()) / 1000);
      return tooManyRequests(retryAfter);
    }
    return null;
  } catch {
    return null; // Fail open if Redis is down
  }
}
