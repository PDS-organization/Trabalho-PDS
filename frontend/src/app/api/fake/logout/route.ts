import { NextResponse } from "next/server";

export async function POST(req: Request) {
  // redireciona para a home
  const res = NextResponse.redirect(new URL("/", req.url));
  // apaga o cookie da sessão
  res.cookies.set("sb:session", "", { httpOnly: true, path: "/", maxAge: 0, sameSite: "lax", secure: process.env.NODE_ENV === "production" });
  return res;
}
