import pino from "pino";

const level = process.env.LOG_LEVEL ?? (process.env.NODE_ENV === "development" ? "debug" : "info");

export const logger =
  process.env.NODE_ENV === "development"
    ? pino({
        level,
        transport: {
          target: "pino-pretty",
          options: { colorize: true },
        },
      })
    : pino({ level });

