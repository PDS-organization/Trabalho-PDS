import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifySession } from "@/lib/jwt";
import path from "node:path";
import fs from "node:fs/promises";

export const runtime = "nodejs";
const FILE_PATH = path.join(process.cwd(), "data", "fake_users.jsonl");

async function findById(id: string) {
  try {
    const buf = await fs.readFile(FILE_PATH, "utf8");
    const lines = buf.trim().split("\n").filter(Boolean);
    for (let i = lines.length - 1; i >= 0; i--) {
      const u = JSON.parse(lines[i]);
      if (u.id === id) return u;
    }
  } catch {}
  return null;
}

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("sb:session")?.value ?? null;
  const payload = await verifySession<{ sub: string; email: string; name: string }>(token);
  if (!payload) return NextResponse.json({ ok: false }, { status: 401 });

  const user = await findById(payload.sub);
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const { id, email, name, birthdate, gender, cep, uf, street, sports } = user;

  return NextResponse.json({
    ok: true,
    user: { id, email, name, birthdate, gender, cep, uf, street, sports },
  });
}
