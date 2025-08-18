import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifySession } from "@/lib/jwt";
import path from "node:path";
import fs from "node:fs/promises";

export const runtime = "nodejs";
const FILE_PATH = path.join(process.cwd(), "data", "fake_users.jsonl");

type FakeUser = {
  id: string;
  name: string;
  email: string;
  username?: string;
  avatarUrl?: string;
};

async function findById(id: string): Promise<FakeUser | null> {
  try {
    const buf = await fs.readFile(FILE_PATH, "utf8");
    const lines = buf.trim().split("\n").filter(Boolean);
    for (let i = lines.length - 1; i >= 0; i--) {
      const u = JSON.parse(lines[i]) as FakeUser;
      if (u.id === id) return u;
    }
  } catch {}
  return null;
}

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("sb:session")?.value ?? null;
  const payload = await verifySession<{ sub: string }>(token);
  if (!payload) return NextResponse.json({ ok: false }, { status: 401 });

  const user = await findById(payload.sub);
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  return NextResponse.json({
    ok: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      username: user.username ?? null,
      avatarUrl: user.avatarUrl ?? null,
    },
  });
}
