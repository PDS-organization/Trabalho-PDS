import path from "node:path";
import fs from "node:fs/promises";

export type UserRecord = {
  id: string;
  name: string;
  email: string;
  username: string;
  cep?: string;
  uf?: string;
  street?: string;
};

const FILE_PATH = path.join(process.cwd(), "data", "fake_users.jsonl");

export async function findUserById(userId: string): Promise<UserRecord | null> {
  try {
    const buf = await fs.readFile(FILE_PATH, "utf8");
    const lines = buf.trim().split("\n").filter(Boolean);
    // lê de trás pra frente (último registro vence)
    for (let i = lines.length - 1; i >= 0; i--) {
      const u = JSON.parse(lines[i]) as UserRecord;
      if (u.id === userId) return u;
    }
  } catch {}
  return null;
}
