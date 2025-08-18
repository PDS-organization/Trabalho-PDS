import path from "node:path";
import fs from "node:fs/promises";

export const FILE_PATH = path.join(process.cwd(), "data", "fake_users.jsonl");

export type FakeUser = {
  id: string;
  createdAt: string;
  name: string;
  email: string;
  username: string;
  avatarUrl?: string;
  birthdate?: string;
  gender?: string;
  cep?: string;
  uf?: string;
  street?: string;
  sports?: string[];
  passwordHash: string;
};

export async function findUserById(id: string): Promise<FakeUser | null> {
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

export async function findUserByUsername(username: string): Promise<FakeUser | null> {
  const u = username.toLowerCase();
  try {
    const buf = await fs.readFile(FILE_PATH, "utf8");
    for (const line of buf.split("\n")) {
      if (!line.trim()) continue;
      const user = JSON.parse(line) as FakeUser;
      if (user.username?.toLowerCase() === u) return user;
    }
  } catch {}
  return null;
}
