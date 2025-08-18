// src/middleware.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { verifySession } from "@/lib/jwt";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Lê o token do cookie httpOnly
  const token = req.cookies.get("sb:session")?.value ?? null;
  const isAuthed = !!(await verifySession(token));

  // 1) Se já estiver logado, redireciona páginas públicas para /app
  if (isAuthed && (pathname === "/" || pathname === "/login" || pathname === "/cadastro")) {
    const url = req.nextUrl.clone();
    url.pathname = "/app";
    return NextResponse.redirect(url);
  }

  // 2) Protege /app: se não logado, manda para /login?next=<rota>
  if (!isAuthed && pathname.startsWith("/app")) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    const nextPath = pathname + (req.nextUrl.search || "");
    url.searchParams.set("next", nextPath);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// Limita a quais rotas o middleware roda
export const config = {
  matcher: ["/", "/login", "/cadastro", "/app/:path*"],
};
