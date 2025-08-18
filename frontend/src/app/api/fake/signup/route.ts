import { NextResponse } from "next/server";
import { z } from "zod";
import path from "node:path";
import fs from "node:fs/promises";
import bcrypt from "bcryptjs";

export const runtime = "nodejs"; // necessário p/ usar fs (não edge)

const USERNAME_RE = /^(?=.*[a-z])[a-z0-9_]{3,20}$/;
function normalize(s: string) {
  return s
    .normalize("NFD").replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_+/g, "_").replace(/^_+|_+$/g, "");
}
const RESERVED = new Set(["app", "admin", "api", "login", "cadastro", "logout", "u", "me", "profile", "settings", "terms", "privacy", "search", "explore", "new", "edit", "dashboard", "static", "assets", "_next"]);


const schema = z.object({
  // step 1
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  username: z.string().transform(normalize).refine((v) => USERNAME_RE.test(v), "invalid"),
  // step 2
  birthdate: z.string().min(1),
  gender: z.enum(["masculino", "feminino", "nao_informar", "outro"]),
  cep: z.string().min(8),
  uf: z.string().min(2),
  street: z.string().min(1),
  // step 3
  sports: z.array(z.string()).min(1),
});

const FILE_PATH = path.join(process.cwd(), "data", "fake_users.jsonl");

async function ensureDirExists() {
  await fs.mkdir(path.dirname(FILE_PATH), { recursive: true });
}

async function usernameExists(u: string) {
  try {
    const buf = await fs.readFile(FILE_PATH, "utf8");
    for (const line of buf.split("\n")) {
      if (!line.trim()) continue;
      const user = JSON.parse(line);
      if (user.username === u) return true;
    }
  } catch { }
  return false;
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Dados inválidos", issues: parsed.error.issues }, { status: 400 });
  }

  const data = parsed.data;
  if (RESERVED.has(data.username)) {
    return NextResponse.json({ ok: false, message: "Username reservado" }, { status: 400 });
  }
  if (await usernameExists(data.username)) {
    return NextResponse.json({ ok: false, message: "Username já em uso" }, { status: 400 });
  }

  const { password, ...rest } = data;
  const passwordHash = await bcrypt.hash(password, 10);

  const record = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...rest,
    passwordHash,
  };

  await ensureDirExists();
  await fs.appendFile(FILE_PATH, JSON.stringify(record) + "\n", "utf8");
  return NextResponse.json({ ok: true });
}
