export const PingSendInputSchema = {
  type: "object",
  properties: {
    to: {
      type: "string",
      description: "Recipient handle (3–32 chars).",
      minLength: 3,
      maxLength: 32,
    },
    body: {
      type: "string",
      description: "Message body (1–280 chars).",
      minLength: 1,
      maxLength: 280,
    },
    senderName: {
      type: "string",
      description: "Optional sender display name (max 80 chars).",
      maxLength: 80,
    },
    senderContact: {
      type: "string",
      description: "Optional sender contact info (max 120 chars).",
      maxLength: 120,
    },
  },
  required: ["to", "body"],
  additionalProperties: false,
} as const;

export const PingSendOutputSchema = {
  type: "object",
  properties: {
    ok: { type: "boolean" },
    messageId: { type: "string" },
    deduped: { type: "boolean" },
    tier: { type: "string" },
    toHandle: { type: "string" },
    payer: { type: "string" },
    requestId: { type: "string" },
  },
  required: ["ok", "messageId", "deduped", "tier", "toHandle", "payer", "requestId"],
  additionalProperties: false,
} as const;

export const X402DemoOutputSchema = {
  type: "object",
  properties: {
    ok: { type: "boolean" },
    requestId: { type: "string" },
    message: { type: "string" },
  },
  required: ["ok", "requestId", "message"],
  additionalProperties: false,
} as const;
