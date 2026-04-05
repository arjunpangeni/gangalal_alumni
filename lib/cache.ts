import { Redis } from "@upstash/redis";

let redis: Redis | null = null;

function getRedis(): Redis | null {
  try {
    if (!redis) redis = Redis.fromEnv();
    return redis;
  } catch { return null; }
}

export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const r = getRedis();
    if (!r) return null;
    return await r.get<T>(key);
  } catch { return null; }
}

export async function setCached<T>(key: string, value: T, ttlSeconds = 300): Promise<void> {
  try {
    const r = getRedis();
    if (!r) return;
    await r.set(key, value, { ex: ttlSeconds });
  } catch {}
}

export const CACHE_KEYS = {
  homepageStats: "alumni:stats:homepage",
  latestArticles: "alumni:articles:latest",
  upcomingEvents: "alumni:events:upcoming",
  latestJobs: "alumni:jobs:latest",
};
