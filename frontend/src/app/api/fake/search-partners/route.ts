// src/app/api/fake/search-partners/route.ts
import { NextResponse } from "next/server";
import path from "node:path";
import { readJsonl } from "@/lib/fake-db";

export const runtime = "nodejs";
const FILE = path.join(process.cwd(), "src", "data", "fake_activities.jsonl");

export async function GET(req: Request) {
  const u = new URL(req.url);
  const sports = u.searchParams.getAll("sports").filter(Boolean);
  const cep = u.searchParams.get("cep") ?? "";
  const date = u.searchParams.get("date") ?? "";
  const time = u.searchParams.get("time") ?? "";

  const all = await readJsonl<any>(FILE);

  const cepPrefix = cep.replace(/\D/g, "").slice(0, 5);

  const results = all.filter((a) => {
    if (a.status !== "open") return false;

    // filtro por sport(s)
    if (sports.length && !sports.includes(a.sport)) return false;

    // filtro por data/hora futura: se vier date/time, respeita; senão, só atividades futuras
    const now = new Date();
    const futureEnough = (() => {
      const [ay, am, ad] = String(a.date).split("-").map(Number);
      const [ah, an] = String(a.time).split(":").map(Number);
      const when = new Date(ay, (am || 1) - 1, ad || 1, ah || 0, an || 0);
      if (date && time) {
        const [qy, qm, qd] = date.split("-").map(Number);
        const [qh, qn] = time.split(":").map(Number);
        const qwhen = new Date(qy, (qm || 1) - 1, qd || 1, qh || 0, qn || 0);
        return when.getTime() >= qwhen.getTime();
      }
      return when.getTime() >= now.getTime();
    })();
    if (!futureEnough) return false;

    // filtro por cep (aproximação por prefixo)
    if (cepPrefix) {
      const aPrefix = String(a.cep).replace(/\D/g, "").slice(0, 5);
      if (aPrefix !== cepPrefix) return false;
    }

    return true;
  }).map((a) => ({
    id: a.id,
    sport: a.sport,
    date: a.date,
    time: a.time,
    cep: a.cep,
    uf: a.uf,
    title: a.title,
    status: a.status,
    capacity: a.capacity ?? null,
    participantsCount: Array.isArray(a.participants) ? a.participants.length : 0,
    creator: { id: a.creatorId }, // no fake não temos avatar/username do criador
    location: null,               // pode preencher depois (bairro/cidade via CEP)
  }));

  return NextResponse.json({ ok: true, results }, { status: 200 });
}
