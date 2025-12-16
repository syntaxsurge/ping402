import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    const demoVideo =
      process.env.DEMO_VIDEO_URL?.trim() || "https://youtu.be/";
    const pitchDeck = process.env.PITCH_DECK_URL?.trim();

    return [
      { source: "/demo-video", destination: demoVideo, permanent: false },
      ...(pitchDeck
        ? [{ source: "/pitch-deck", destination: pitchDeck, permanent: false }]
        : []),
    ];
  },
};

export default nextConfig;
