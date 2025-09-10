// src/app/api/auth/login/route.ts
import { NextResponse } from "next/server";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
export const runtime = "nodejs";

export async function OPTIONS() {
  return NextResponse.json({ ok: true });
}

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { code: "BAD_REQUEST", message: "Informe email e senha." },
        { status: 400 }
      );
    }

    const resp = await fetch(`${API}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }), // backend espera { email, password }
    });

    const data = await resp.json().catch(() => ({}));

    if (!resp.ok) {
      return NextResponse.json(
        { code: data?.code ?? "AUTH_ERROR", message: data?.message ?? "Falha no login" },
        { status: resp.status }
      );
    }

    const token = data?.token as string | undefined;
    if (!token) {
      return NextResponse.json(
        { code: "NO_TOKEN", message: "Token não recebido do servidor." },
        { status: 502 }
      );
    }

    const raw = typeof data?.token === "string" ? data.token : undefined;
    if (!raw) {
      return NextResponse.json({ code: "NO_TOKEN", message: "Token não recebido do servidor." }, { status: 502 });
    }

    const jwt = raw.replace(/^Bearer\s+/i, "");

    const res = NextResponse.json({ ok: true });
    console.log(res)
    res.cookies.set({
      name: "sb_session",
      value: jwt,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  } catch (e: any) {
    return NextResponse.json(
      { code: "INTERNAL", message: e?.message ?? "Erro interno" },
      { status: 500 }
    );
  }
}
