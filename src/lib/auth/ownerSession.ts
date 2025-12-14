import "server-only";

import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";
import { getEnvServer } from "@/lib/env/env.server";

const COOKIE_NAME = "ping402_owner";
const ISSUER = "ping402";
const AUDIENCE = "ping402";

function getSecret() {
  const env = getEnvServer();
  return new TextEncoder().encode(env.PING402_JWT_SECRET);
}

export async function setOwnerSession(walletPubkey: string) {
  const jwt = await new SignJWT({ role: "owner" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(walletPubkey)
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

export async function getOwnerSession(): Promise<{ walletPubkey: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      issuer: ISSUER,
      audience: AUDIENCE,
    });

    const env = getEnvServer();
    if (payload.sub !== env.NEXT_PUBLIC_WALLET_ADDRESS) return null;

    return { walletPubkey: payload.sub };
  } catch {
    return null;
  }
}

export async function clearOwnerSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
