import { NextResponse, type NextRequest } from "next/server";

function applySecurityHeaders(res: NextResponse) {
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.headers.set("Cross-Origin-Resource-Policy", "same-origin");
  res.headers.set("Cache-Control", "no-store");
}

export async function middleware(req: NextRequest) {
  const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID();

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-request-id", requestId);

  const res = NextResponse.next({
    request: { headers: requestHeaders },
  });
  res.headers.set("x-request-id", requestId);
  applySecurityHeaders(res);
  return res;
}

export const config = {
  matcher: ["/api/:path*"],
};
