import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

export async function PUT(req: Request) {
  try {
    const token = (await cookies()).get("sb_session")?.value;
    if (!token) {
      return NextResponse.json({ code: "UNAUTHENTICATED" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    // remove campos vazios/undefined/strings vazias
    const cleaned: Record<string, any> = {};
    for (const [k, v] of Object.entries(body || {})) {
      if (v === undefined || v === null) continue;
      if (typeof v === "string" && v.trim() === "") continue;
      cleaned[k] = v;
    }

    const upstream = await fetch(`${API}/users`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      body: JSON.stringify(cleaned),
    });

    const text = await upstream.text().catch(() => "");
    // 200 OK -> retorna JSON do backend
    if (upstream.ok) {
      try {
        return NextResponse.json(JSON.parse(text), { status: upstream.status });
      } catch {
        return NextResponse.json({ ok: true }, { status: upstream.status });
      }
    }

    let payload: any = null;
    try { payload = text ? JSON.parse(text) : null; } catch { payload = { raw: text }; }

    const status = upstream.status >= 400 && upstream.status < 500 ? upstream.status : 502;
    return NextResponse.json(
      { code: "UPSTREAM_ERROR", message: `Backend ${upstream.status}`, upstreamStatus: upstream.status, upstreamBody: payload },
      { status }
    );
  } catch (e: any) {
    return NextResponse.json({ code: "INTERNAL", message: e?.message ?? "Erro interno" }, { status: 500 });
  }
}
