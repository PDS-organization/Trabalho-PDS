// app/api/users/[username]/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

export async function GET(
  _req: Request,
  { params }: { params: { username: string } }
) {
  try {
    const token = (await cookies()).get("sb_session")?.value;
    if (!token) {
      return NextResponse.json({ code: "UNAUTHENTICATED" }, { status: 401 });
    }

    const upstream = await fetch(`${API}/users/${encodeURIComponent(params.username)}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    // repassa body/status do backend
    const text = await upstream.text();
    const res = new NextResponse(text, { status: upstream.status });
    // repassa content-type se vier
    const ct = upstream.headers.get("Content-Type");
    if (ct) res.headers.set("Content-Type", ct);
    return res;
  } catch (e: any) {
    return NextResponse.json(
      { code: "INTERNAL", message: e?.message ?? "Erro interno" },
      { status: 500 }
    );
  }
}
