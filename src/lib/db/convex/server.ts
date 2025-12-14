import "server-only";

import { ConvexHttpClient } from "convex/browser";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { getEnvServer } from "@/lib/env/env.server";
import { parseHandle } from "@/lib/utils/handles";

let cachedClient: ConvexHttpClient | undefined;

function getClient(): ConvexHttpClient {
  if (cachedClient) return cachedClient;
  cachedClient = new ConvexHttpClient(getEnvServer().NEXT_PUBLIC_CONVEX_URL);
  return cachedClient;
}

export async function getProfileByHandle(handle: string) {
  const normalized = parseHandle(handle);
  if (!normalized) return null;
  return await getClient().query(api.profiles.byHandle, { handle: normalized });
}

export async function claimHandle(input: {
  handle: string;
  displayName: string;
  ownerWallet: string;
  bio?: string;
}) {
  return await getClient().mutation(api.profiles.claimHandle, input);
}

export async function createPaidMessageForHandle(input: {
  toHandle: string;
  tier: "standard" | "priority" | "vip";
  body: string;
  senderName?: string;
  senderContact?: string;
  payer: string;
  paymentTxSig: string;
  xPaymentB64: string;
  x402Network?: string;
  x402Scheme?: string;
  x402Version?: number;
}) {
  return await getClient().mutation(api.messages.createPaidForHandle, input);
}

export async function listMessagesForHandleByStatus(input: {
  handle: string;
  status: "new" | "replied" | "archived";
  cursor: string | null;
  numItems: number;
}) {
  return await getClient().query(api.messages.listForHandleByStatus, input);
}

export async function getMessageForHandleById(input: {
  handle: string;
  messageId: Id<"messages">;
}) {
  return await getClient().query(api.messages.getForHandleById, {
    handle: input.handle,
    messageId: input.messageId,
  });
}

export async function getInboxStatsForHandle(input: { handle: string }) {
  return await getClient().query(api.messages.getStatsForHandle, input);
}

export async function setMessageStatusForHandle(input: {
  handle: string;
  messageId: Id<"messages">;
  status: "new" | "replied" | "archived";
}) {
  return await getClient().mutation(api.messages.setStatusForHandle, {
    handle: input.handle,
    messageId: input.messageId,
    status: input.status,
  });
}

export async function storeAuthNonce(input: { nonce: string; createdAt: number }) {
  return await getClient().mutation(api.auth.storeNonce, input);
}

export async function consumeAuthNonce(input: { nonce: string }) {
  return await getClient().mutation(api.auth.consumeNonce, input);
}
