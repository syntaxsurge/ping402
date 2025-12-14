import { logger } from "@/lib/observability/logger";

export async function register() {
  logger.info({ nodeEnv: process.env.NODE_ENV }, "ping402.instrumentation.registered");
}

