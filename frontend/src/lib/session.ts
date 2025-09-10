// src/lib/session.ts
import { cookies } from "next/headers";

type Me = { id: string; email: string; username: string; name?: string };

export async function getSessionUser(): Promise<Me | null> {
  const origin = process.env.NEXT_PUBLIC_APP_ORIGIN || "http://localhost:3000";

  // 🔑 pegue os cookies da requisição atual e serialize
  const cookieHeader = (await cookies()).toString();
  const headers: HeadersInit = {};
  if (cookieHeader) (headers as Record<string, string>).cookie = cookieHeader;

  const res = await fetch(`${origin}/api/auth/me`, {
    cache: "no-store",
    headers,
  });

  if (res.status === 401) return null;
  if (!res.ok) return null;

  return (await res.json()) as Me;
}
