import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  // Protect orders pages only
  if (req.nextUrl.pathname.startsWith("/orders")) {
    const token = req.cookies.get("session_token")?.value;
    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", req.nextUrl.pathname);
      return NextResponse.redirect(url);
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/orders", "/orders/:path*"],
};
