// app/api/atividades/[id]/inscrever/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const token = (await cookies()).get("sb_session")?.value;
    if (!token) {
      return NextResponse.json({ code: "UNAUTHENTICATED" }, { status: 401 });
    }

    const upstream = await fetch(`${API}/atividades/${params.id}/inscrever`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json, text/plain, */*",
      },
    });

    if (upstream.status === 204) {
      // ok, sem corpo
      return new NextResponse(null, { status: 204 });
    }

    const text = await upstream.text().catch(() => "");
    let payload: any = null;
    try {
      payload = text ? JSON.parse(text) : null;
    } catch {
      payload = { raw: text };
    }

    const status =
      upstream.status >= 400 && upstream.status < 500 ? upstream.status : 502;

    return NextResponse.json(
      {
        code: "UPSTREAM_ERROR",
        message: `Backend ${upstream.status}`,
        upstreamStatus: upstream.status,
        upstreamBody: payload,
      },
      { status }
    );
  } catch (e: any) {
    return NextResponse.json(
      { code: "INTERNAL", message: e?.message ?? "Erro interno" },
      { status: 500 }
    );
  }
}
