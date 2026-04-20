// PR #7a: distributed rate-limit via Upstash Redis.
//
// Why: Vercel serverless invocations are stateless across instances and
// regions. The previous Map<ip, timestamps> limiter only constrained
// traffic that happened to land on the same warm instance, so an attacker
// could trivially bypass it by cycling requests until they hit a cold
// instance in a different region. Upstash gives us shared counters.
//
// Fail-open policy: if Upstash credentials are missing (e.g. local dev
// without a .env) or the service is unreachable, requests are allowed
// through. This matches the previous in-memory behavior on cold starts
// and avoids taking the public form offline if Upstash has an outage.
// The limiter is a defense-in-depth layer, not the sole gate — Origin,
// Zod validation, and captcha (future) still apply.

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

type LimiterName = 'send' | 'clientLog' | 'visualLedSave' | 'visualLedAnalyze';

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

let redisSingleton: Redis | null = null;
const limiters = new Map<LimiterName, Ratelimit>();

function getRedis(): Redis | null {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) return null;
  if (!redisSingleton) {
    redisSingleton = new Redis({ url: UPSTASH_URL, token: UPSTASH_TOKEN });
  }
  return redisSingleton;
}

function getLimiter(name: LimiterName): Ratelimit | null {
  const redis = getRedis();
  if (!redis) return null;

  const existing = limiters.get(name);
  if (existing) return existing;

  // Sliding window keeps behavior predictable right at the boundary,
  // unlike fixed windows where an attacker can double the burst by
  // straddling the reset.
  const config: Record<LimiterName, { tokens: number; window: `${number} ${'s' | 'm' | 'h'}` }> = {
    send: { tokens: 10, window: '15 m' },
    clientLog: { tokens: 30, window: '1 m' },
    visualLedSave: { tokens: 20, window: '10 m' },
    // Analyze endpoint can be expensive (image math). Keep tighter limits.
    visualLedAnalyze: { tokens: 30, window: '1 m' },
  };

  const { tokens, window } = config[name];
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(tokens, window),
    prefix: `ratelimit:${name}`,
    analytics: false,
  });

  limiters.set(name, limiter);
  return limiter;
}

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  limit: number;
  reset: number;
};

export async function checkRateLimit(
  name: LimiterName,
  key: string,
): Promise<RateLimitResult> {
  const limiter = getLimiter(name);

  // Fail-open when Upstash is not configured. Warn once per cold start so
  // the misconfiguration is visible in logs without spamming.
  if (!limiter) {
    if (!warnedMissing) {
      console.warn('[rateLimit] UPSTASH_REDIS_REST_URL/TOKEN not set — rate limiting disabled');
      warnedMissing = true;
    }
    return { allowed: true, remaining: Infinity, limit: Infinity, reset: 0 };
  }

  try {
    const result = await limiter.limit(key);
    return {
      allowed: result.success,
      remaining: result.remaining,
      limit: result.limit,
      reset: result.reset,
    };
  } catch (err) {
    // Fail-open on Upstash error. Log so an outage is noticed, but do
    // not block legitimate traffic.
    console.error('[rateLimit] Upstash error — failing open:', err);
    return { allowed: true, remaining: Infinity, limit: Infinity, reset: 0 };
  }
}

let warnedMissing = false;
