const YOUTUBE_VIDEO_ID_PATTERN = /^[a-zA-Z0-9_-]{11}$/;

function normalizeYouTubeVideoId(value: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return YOUTUBE_VIDEO_ID_PATTERN.test(trimmed) ? trimmed : null;
}

export function getYouTubeVideoId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const directId = normalizeYouTubeVideoId(trimmed);
  if (directId) return directId;

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }

  const hostname = url.hostname.replace(/^www\./, "").toLowerCase();

  if (hostname === "youtu.be") {
    const [candidate] = url.pathname.split("/").filter(Boolean);
    return normalizeYouTubeVideoId(candidate ?? null);
  }

  const isYouTubeHost =
    hostname === "youtube.com" ||
    hostname.endsWith(".youtube.com") ||
    hostname === "youtube-nocookie.com" ||
    hostname.endsWith(".youtube-nocookie.com");

  if (!isYouTubeHost) return null;

  const fromQuery = normalizeYouTubeVideoId(url.searchParams.get("v"));
  if (fromQuery) return fromQuery;

  const segments = url.pathname.split("/").filter(Boolean);
  if (segments.length >= 2 && ["embed", "shorts", "live"].includes(segments[0] ?? "")) {
    return normalizeYouTubeVideoId(segments[1] ?? null);
  }

  return null;
}

