// app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const res = NextResponse.redirect(new URL("/", req.url), { status: 303 });
  const toDelete = ["sb_session", "sb_refresh", "access_token", "session"];
  for (const name of toDelete) {
    res.cookies.set({
      name,
      value: "",
      path: "/",                 // precisa bater com o path do cookie original
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 0,                 // expira imediatamente
    });
  }

  return res;
}
