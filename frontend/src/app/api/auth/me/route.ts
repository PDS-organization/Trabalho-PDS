// src/app/api/auth/me/route.ts
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const runtime = "nodejs";        // evita Edge (que costuma quebrar http://localhost:8080)
export const dynamic = "force-dynamic"; // sem cache agressivo

const API =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:8080"; // ajuste p/ incluir context-path se houver (ex: http://localhost:8080/api)

export async function GET() {
  try {
    // 👇 NEXT 15: cookies() é assíncrono
    const ck = await cookies();
    const raw = ck.get("sb_session")?.value;

    if (!raw) {
      return NextResponse.json(
        { code: "UNAUTHENTICATED", message: "Sem token" },
        { status: 401 }
      );
    }

    // garante exatamente um "Bearer "
    const authHeader = raw.startsWith("Bearer ") ? raw : `Bearer ${raw}`;

    const upstream = await fetch(`${API}/me`, {
      method: "GET",
      headers: { Authorization: authHeader, Accept: "application/json" },
      cache: "no-store",
    });

    const bodyText = await upstream.text().catch(() => "");

    if (upstream.status === 401) {
      return NextResponse.json(
        {
          code: "UNAUTHENTICATED",
          message: "Token inválido/expirado",
          upstreamStatus: 401,
          upstreamBody: bodyText,
        },
        { status: 401 }
      );
    }

    if (!upstream.ok) {
      // devolve status e corpo do backend para debug
      return NextResponse.json(
        {
          code: "UPSTREAM_ERROR",
          message: `Backend ${upstream.status}`,
          upstreamStatus: upstream.status,
          upstreamBody: bodyText,
        },
        { status: 502 }
      );
    }

    const json = bodyText ? JSON.parse(bodyText) : {};
    return NextResponse.json(json, { status: 200 });
  } catch (err: any) {
    console.error("[/api/auth/me] error:", err);
    return NextResponse.json(
      {
        code: "INTERNAL",
        message: "Falha ao consultar backend",
        error: String(err?.message ?? err),
      },
      { status: 500 }
    );
  }
}
