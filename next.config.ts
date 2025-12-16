import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    const demoVideo = process.env.DEMO_VIDEO_URL?.trim() || "https://www.youtube.com/";
    const pitchDeck = process.env.PITCH_DECK_URL?.trim() || "https://example.com/";

    return [
      {
        source: "/demo-video",
        destination: demoVideo,
        permanent: false,
      },
      {
        source: "/pitch-deck",
        destination: pitchDeck,
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
