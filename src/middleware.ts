import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis/cloudflare";

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}

const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

const redis =
  upstashUrl && upstashToken ? new Redis({ url: upstashUrl, token: upstashToken }) : null;

if (process.env.NODE_ENV === "production" && !redis) {
  console.warn(
    "[ping402] Upstash rate limiting is disabled (missing UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN).",
  );
}

const readLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(300, "60 s"),
      prefix: "ping402:rl:read",
      analytics: true,
    })
  : null;

const writeLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(60, "60 s"),
      prefix: "ping402:rl:write",
      analytics: true,
    })
  : null;

const authLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, "60 s"),
      prefix: "ping402:rl:auth",
      analytics: true,
    })
  : null;

function applySecurityHeaders(res: NextResponse) {
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.headers.set("Cross-Origin-Resource-Policy", "same-origin");
  res.headers.set("Cache-Control", "no-store");
}

function applyRateLimitHeaders(res: NextResponse, data: { limit: number; remaining: number; reset: number }) {
  res.headers.set("X-RateLimit-Limit", String(data.limit));
  res.headers.set("X-RateLimit-Remaining", String(data.remaining));
  res.headers.set("X-RateLimit-Reset", String(data.reset));
}

export async function middleware(req: NextRequest, event: NextFetchEvent) {
  const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID();
  const pathname = req.nextUrl.pathname;
  const method = req.method.toUpperCase();

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-request-id", requestId);

  let rateLimit: { limit: number; remaining: number; reset: number } | null = null;

  if (pathname !== "/api/health") {
    const ip = getClientIp(req);
    const isAuth = pathname.startsWith("/api/auth/");
    const isWrite = method !== "GET" && method !== "HEAD";

    const limiter = isAuth ? authLimiter : isWrite ? writeLimiter : readLimiter;
    if (limiter) {
      const { success, limit, remaining, reset, pending } = await limiter.limit(
        `${ip}:${pathname}`,
      );
      event.waitUntil(pending);

      if (!success) {
        const retryAfterSeconds = Math.max(0, Math.ceil((reset - Date.now()) / 1000));
        const res = NextResponse.json(
          { error: { code: "RATE_LIMITED" }, requestId },
          {
            status: 429,
            headers: {
              "Retry-After": String(retryAfterSeconds),
              "x-request-id": requestId,
            },
          },
        );
        applyRateLimitHeaders(res, { limit, remaining, reset });
        applySecurityHeaders(res);
        return res;
      }

      rateLimit = { limit, remaining, reset };
    }
  }

  const res = NextResponse.next({
    request: { headers: requestHeaders },
  });
  res.headers.set("x-request-id", requestId);
  if (rateLimit) applyRateLimitHeaders(res, rateLimit);
  applySecurityHeaders(res);
  return res;
}

export const config = {
  matcher: ["/api/:path*"],
};
