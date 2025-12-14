import { HOUR, MINUTE, RateLimiter } from "@convex-dev/rate-limiter";
import { components } from "../_generated/api";

export const rateLimiter = new RateLimiter(components.rateLimiter, {
  sendPing: { kind: "token bucket", rate: 6, period: HOUR, capacity: 2 },
  sendPingToRecipient: { kind: "token bucket", rate: 2, period: MINUTE, capacity: 1 },
  authNonce: { kind: "token bucket", rate: 60, period: HOUR, capacity: 10 },
  authVerify: { kind: "token bucket", rate: 30, period: HOUR, capacity: 5 },
});

