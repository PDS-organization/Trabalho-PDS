// src/app/api/me/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";

export async function GET() {
  const cookieStore = await cookies();              // <-- agora é async
  const token = cookieStore.get("sb:session")?.value;

  if (!token) {
    return NextResponse.json(
      { code: "UNAUTHENTICATED", message: "Não logado" },
      { status: 401 }
    );
  }

  return NextResponse.json({ ok: true });
}
