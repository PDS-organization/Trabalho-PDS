// src/lib/fake-db.ts
import path from "node:path";
import fs from "node:fs/promises";

export type Json = Record<string, any>;

export async function ensureDir(filePath: string) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

export async function readJsonl<T = any>(filePath: string): Promise<T[]> {
  try {
    const buf = await fs.readFile(filePath, "utf8");
    return buf
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => JSON.parse(l));
  } catch {
    return [];
  }
}

export async function appendJsonl(filePath: string, record: Json) {
  await ensureDir(filePath);
  await fs.appendFile(filePath, JSON.stringify(record) + "\n", "utf8");
}

export async function writeJsonl(filePath: string, records: Json[]) {
  await ensureDir(filePath);
  const lines = records.map((r) => JSON.stringify(r)).join("\n") + "\n";
  await fs.writeFile(filePath, lines, "utf8");
}

export function cepPrefix(cep: string) {
  const digits = cep.replace(/\D/g, "");
  return digits.slice(0, 5);
}

export function isFuture(dateYMD: string, timeHHMM: string) {
  const [y, m, d] = dateYMD.split("-").map(Number);
  const [hh, mm] = timeHHMM.split(":").map(Number);
  const when = new Date(y, m - 1, d, hh, mm, 0, 0);
  return when.getTime() >= Date.now();
}
