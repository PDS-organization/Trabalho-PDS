import { NextResponse } from "next/server";
import { z } from "zod";
import path from "node:path";
import fs from "node:fs/promises";
import bcrypt from "bcryptjs";

export const runtime = "nodejs"; // necessário p/ usar fs (não edge)

const schema = z.object({
  // step 1
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  // step 2
  birthdate: z.string().min(1), // "YYYY-MM-DD"
  gender: z.enum(["masculino","feminino","nao_informar","outro"]),
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

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: "Dados inválidos", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const {
    password,
    ...rest
  } = parsed.data;

  const passwordHash = await bcrypt.hash(password, 10);

  const record = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...rest,
    passwordHash,
  };

  try {
    await ensureDirExists();
    // JSON Lines: 1 cadastro por linha
    await fs.appendFile(FILE_PATH, JSON.stringify(record) + "\n", "utf8");
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[_fake/signup] write error:", err);
    return NextResponse.json({ ok: false, message: "Falha ao salvar" }, { status: 500 });
  }
}
