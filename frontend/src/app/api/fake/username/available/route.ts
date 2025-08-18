import { NextResponse } from "next/server";
import path from "node:path";
import fs from "node:fs/promises";

export const runtime = "nodejs";
const FILE_PATH = path.join(process.cwd(), "data", "fake_users.jsonl");
const USERNAME_RE = /^(?=.*[a-z])[a-z0-9_]{3,20}$/;
const RESERVED = new Set([
  "app","admin","api","login","cadastro","logout","u","me","profile","settings",
  "terms","privacy","search","explore","new","edit","dashboard","static","assets","_next",
]);

function normalize(s: string) {
  return s
    .normalize("NFD").replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_+/g, "_").replace(/^_+|_+$/g, "");
}

async function usernameExists(u: string) {
  try {
    const buf = await fs.readFile(FILE_PATH, "utf8");
    for (const line of buf.split("\n")) {
      if (!line.trim()) continue;
      const user = JSON.parse(line);
      if (user.username === u) return true;
    }
  } catch {}
  return false;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("u") || "";
  const u = normalize(q);

  if (!USERNAME_RE.test(u)) {
    return NextResponse.json({ available: false, reason: "invalid" }, { status: 200 });
  }
  if (RESERVED.has(u)) {
    return NextResponse.json({ available: false, reason: "reserved" }, { status: 200 });
  }
  const taken = await usernameExists(u);
  return NextResponse.json({ available: !taken, reason: taken ? "taken" : "ok" });
}
