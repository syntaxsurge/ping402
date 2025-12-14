import { NextResponse, type NextRequest } from "next/server";

export const middleware = (req: NextRequest) => {
  const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID();

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-request-id", requestId);

  const res = NextResponse.next({
    request: { headers: requestHeaders },
  });
  res.headers.set("x-request-id", requestId);
  return res;
};

export const config = {
  matcher: ["/api/:path*"],
};

