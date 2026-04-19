import { NextRequest, NextResponse } from "next/server";

// Intentionally vulnerable: the middleware logs the full request headers
// object at INFO level on every request. Authorization and Cookie headers
// carrying signed JWT tokens land in the log drain and become available to
// anyone with log-drain access.
export function middleware(req: NextRequest) {
  console.log("request", {
    url: req.url,
    headers: Object.fromEntries(req.headers.entries()),
  });
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next).*)"],
};
