import { NextResponse } from "next/server";
import path from "node:path";
import fs from "node:fs/promises";
import bcrypt from "bcryptjs";
import { signSession } from "@/lib/jwt";

export const runtime = "nodejs";

const FILE_PATH = path.join(process.cwd(), "data", "fake_users.jsonl");

async function findUserByEmail(email: string) {
  try {
    const buf = await fs.readFile(FILE_PATH, "utf8");
    const lines = buf.trim().split("\n").filter(Boolean);
    for (let i = lines.length - 1; i >= 0; i--) {
      const u = JSON.parse(lines[i]);
      if (u.email?.toLowerCase() === email.toLowerCase()) return u;
    }
  } catch {}
  return null;
}

export async function POST(req: Request) {
  const { email, password } = await req.json().catch(() => ({}));
  if (!email || !password) {
    return NextResponse.json({ ok: false, message: "E-mail e senha obrigatórios" }, { status: 400 });
  }
  const user = await findUserByEmail(email);
  if (!user) {
    return NextResponse.json({ ok: false, message: "Usuário não encontrado" }, { status: 401 });
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return NextResponse.json({ ok: false, message: "Senha incorreta" }, { status: 401 });
  }

  const token = await signSession({ sub: user.id, email: user.email, name: user.name });

  const res = NextResponse.json({ ok: true });
  res.cookies.set("sb:session", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 dias
  });
  return res;
}
