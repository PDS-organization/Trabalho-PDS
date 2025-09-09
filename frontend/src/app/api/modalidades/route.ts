import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

export async function GET() {
  try {
    const token = (await cookies()).get("sb_session")?.value;
    if (!token) {
      return NextResponse.json({ code: "UNAUTHENTICATED" }, { status: 401 });
    }

    const r = await fetch(`${API}/modalidades`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const text = await r.text().catch(() => "");
    if (!r.ok) {
      let payload: any = null;
      try { payload = text ? JSON.parse(text) : null; } catch { payload = { raw: text }; }
      const status = r.status >= 400 && r.status < 500 ? r.status : 502;
      return NextResponse.json({ code: "UPSTREAM_ERROR", upstreamStatus: r.status, upstreamBody: payload }, { status });
    }

    // backend responde { data: ModalidadeDTO[] }
    const json = text ? JSON.parse(text) : { data: [] };
    return NextResponse.json(json, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ code: "INTERNAL", message: e?.message ?? "Erro interno" }, { status: 500 });
  }
}
