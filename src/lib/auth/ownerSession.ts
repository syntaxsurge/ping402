import "server-only";

import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";
import { getEnvServer } from "@/lib/env/env.server";
import { parseHandle } from "@/lib/utils/handles";

const COOKIE_NAME = "ping402_owner";
const ISSUER = "ping402";
const AUDIENCE = "ping402";

function getSecret() {
  const env = getEnvServer();
  return new TextEncoder().encode(env.PING402_JWT_SECRET);
}

export async function setOwnerSession(input: { walletPubkey: string; handle: string }) {
  const jwt = await new SignJWT({ role: "creator", handle: input.handle })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(input.walletPubkey)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, jwt, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function getOwnerSession(): Promise<{ walletPubkey: string; handle: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      issuer: ISSUER,
      audience: AUDIENCE,
    });

    if (typeof payload.sub !== "string" || payload.sub.length < 20) return null;
    if (typeof payload.handle !== "string") return null;
    const handle = parseHandle(payload.handle);
    if (!handle) return null;

    return { walletPubkey: payload.sub, handle };
  } catch {
    return null;
  }
}

export async function clearOwnerSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
