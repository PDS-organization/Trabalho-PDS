// app/api/atividades/proximas/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const params = url.searchParams.toString();

    // pega o JWT do cookie (ajuste o nome conforme seu app)
    const token = (await cookies()).get("sb_session")?.value;
    if (!token) {
      return NextResponse.json({ code: "UNAUTHENTICATED" }, { status: 401 });
    }

    // chama o backend
    const upstream = await fetch(`${API}/atividades/proximas?${params}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const text = await upstream.text();
    let payload: any = null;
    try {
      payload = text ? JSON.parse(text) : null;
    } catch {
      payload = { raw: text };
    }

    if (upstream.ok) {
      return NextResponse.json(payload, { status: upstream.status });
    }

    return NextResponse.json(
      {
        code: "UPSTREAM_ERROR",
        message: `Backend ${upstream.status}`,
        upstreamStatus: upstream.status,
        upstreamBody: payload,
      },
      { status: upstream.status }
    );
  } catch (e: any) {
    return NextResponse.json(
      { code: "INTERNAL", message: e?.message ?? "Erro interno" },
      { status: 500 }
    );
  }
}
