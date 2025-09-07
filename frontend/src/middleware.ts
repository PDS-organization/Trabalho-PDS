import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIXES = ["/app", "/dashboard"]; // ajuste as áreas protegidas

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (!isProtected) return;

  const token = req.cookies.get("auth_token")?.value;
  if (!token) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", pathname); // para redirecionar de volta após login
    return NextResponse.redirect(url);
  }
  return;
}

export const config = {
  matcher: ["/app/:path*", "/dashboard/:path*"], // mesmo que PROTECTED_PREFIXES
};
