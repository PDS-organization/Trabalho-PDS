// /api/test-users/route.ts
import { NextResponse } from "next/server";
import path from "node:path";
import { readJsonl } from "@/lib/fake-db";

const USERS_FILE = path.join(process.cwd(), "src", "data", "fake_users.jsonl");

export async function GET() {
  try {
    const users = await readJsonl<any>(USERS_FILE);
    return NextResponse.json({
      file: USERS_FILE,
      count: users.length,
      users: users.slice(0, 3) // primeiros 3 usuários
    });
  } catch (error) {
    return NextResponse.json({
      error: error.message,
      file: USERS_FILE
    });
  }
}