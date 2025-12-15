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

export const ClaimHandleInputSchema = {
  type: "object",
  properties: {
    publicKey: {
      type: "string",
      description: "Creator wallet public key (base58).",
      minLength: 32,
    },
    signature: {
      description: "Detached signature bytes (array) or base64-encoded string.",
      anyOf: [
        {
          type: "array",
          items: { type: "integer", minimum: 0, maximum: 255 },
        },
        { type: "string", minLength: 1 },
      ],
    },
    nonce: { type: "string", minLength: 10 },
    issuedAt: { type: "string", format: "date-time" },
    handle: { type: "string", minLength: 1 },
    displayName: { type: "string", maxLength: 64 },
    bio: { type: "string", maxLength: 280 },
  },
  required: ["publicKey", "signature", "nonce", "issuedAt", "handle"],
  additionalProperties: false,
} as const;

export const ClaimHandleOutputSchema = {
  type: "object",
  properties: {
    ok: { type: "boolean" },
    requestId: { type: "string" },
  },
  required: ["ok", "requestId"],
  additionalProperties: false,
} as const;

