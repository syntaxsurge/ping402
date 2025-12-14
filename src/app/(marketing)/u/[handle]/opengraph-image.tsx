import { ImageResponse } from "next/og";

import { getProfileByHandle } from "@/lib/db/convex/server";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const dynamic = "force-dynamic";

export default async function Image({
  params,
}: {
  params: { handle: string };
}) {
  const handle = decodeURIComponent(params.handle).trim().toLowerCase();

  let title = `@${handle}`;
  let subtitle = "Paid pings via Solana x402 (HTTP 402 Payment Required).";

  try {
    const profile = await getProfileByHandle(handle);
    if (profile) {
      title = `${profile.displayName} (@${profile.handle})`;
      subtitle = profile.bio?.slice(0, 120) || subtitle;
    }
  } catch {
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "72px",
          background: "#0b0b0f",
          color: "white",
        }}
      >
        <div style={{ fontSize: 56, fontWeight: 700, lineHeight: 1.1 }}>
          {title}
        </div>
        <div style={{ marginTop: 20, fontSize: 28, color: "#c7c7d1" }}>
          {subtitle}
        </div>
        <div style={{ marginTop: 44, fontSize: 22, color: "#8f8fa0" }}>
          ping402 · Solana micropayments · x402 paywall
        </div>
      </div>
    ),
    size
  );
}
