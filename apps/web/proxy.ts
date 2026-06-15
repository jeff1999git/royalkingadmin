import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function proxy(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    if ((pathname === "/" || pathname === "/login") && token) {
      if (token.role === "admin") {
        return NextResponse.redirect(new URL("/admin/amounts", req.url));
      }
      if (token.role === "driver") {
        return NextResponse.redirect(new URL("/driver", req.url));
      }
    }

    if (pathname.startsWith("/admin") && token?.role !== "admin") {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    if (pathname.startsWith("/driver") && token?.role !== "driver") {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: () => true,
    },
  }
);

export const config = {
  matcher: ["/", "/login", "/admin/:path*", "/driver/:path*"],
};
