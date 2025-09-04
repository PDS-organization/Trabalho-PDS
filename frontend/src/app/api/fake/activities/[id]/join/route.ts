// src/app/api/fake/activities/[id]/join/route.ts
import { NextResponse } from "next/server";
import path from "node:path";
import { cookies } from "next/headers";
import { readJsonl, writeJsonl, isFuture } from "@/lib/fake-db";
import { verifySession } from "@/lib/jwt";

export const runtime = "nodejs";
const FILE = path.join(process.cwd(), "src", "data", "fake_activities.jsonl");

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const cookieStore = await cookies();
  const token = cookieStore.get("sb:session")?.value ?? null;
  const session = await verifySession<{ sub: string }>(token);
  if (!session) return NextResponse.json({ ok: false, message: "Não autenticado" }, { status: 401 });

  const id = params.id;
  const all = await readJsonl<any>(FILE);
  const idx = all.findIndex((a) => a.id === id);
  if (idx === -1) return NextResponse.json({ ok: false, message: "Atividade não encontrada" }, { status: 404 });

  const act = all[idx];

  if (act.status !== "open")
    return NextResponse.json({ ok: false, message: "Atividade não está aberta" }, { status: 409 });

  if (!isFuture(act.date, act.time))
    return NextResponse.json({ ok: false, message: "Atividade já passou" }, { status: 409 });

  const already = (act.participants ?? []).some((p: any) => p.userId === session.sub);
  if (already)
    return NextResponse.json({ ok: false, message: "Você já está participando" }, { status: 409 });

  const count = (act.participants ?? []).length;
  if (act.capacity && count >= act.capacity)
    return NextResponse.json({ ok: false, message: "Atividade cheia" }, { status: 409 });

  const updated = {
    ...act,
    participants: [
      ...(act.participants ?? []),
      { userId: session.sub, joinedAt: new Date().toISOString(), role: "member" as const },
    ],
  };

  const newCount = updated.participants.length;
  if (updated.capacity && newCount >= updated.capacity) {
    updated.status = "closed";
  }

  all[idx] = updated;
  await writeJsonl(FILE, all);

  return NextResponse.json({ ok: true, participantsCount: newCount, status: updated.status }, { status: 200 });
}
