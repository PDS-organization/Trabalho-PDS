// app/api/atividades/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

// lista de modalidades válidas (minúsculas), iguais ao backend
const MODALIDADES = new Set([
  "corrida",
  "musculacao",
  "natacao",
  "boxe",
  "futebol",
  "volei",
  "ciclismo",
  "tenis",
  "basquete",
]);

function ensureString(v: unknown): string {
  return (v ?? "").toString().trim();
}

function toHHMMSS(t: string): string {
  // aceita "HH:mm" e normaliza para "HH:mm:ss"
  return /^\d{2}:\d{2}:\d{2}$/.test(t) ? t : `${t}:00`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // pegue seu JWT de onde você salvou (ajuste o nome do cookie conforme seu app)
    const token = (await cookies()).get("sb_session")?.value;
    if (!token) {
      return NextResponse.json({ code: "UNAUTHENTICATED" }, { status: 401 });
    }

    // ---- campos vindos do form (já em PT-BR)
    const modalidade = ensureString(body?.modalidade).toLowerCase();
    const data = ensureString(body?.data);            // YYYY-MM-DD
    const horario = toHHMMSS(ensureString(body?.horario)); // HH:mm:ss
    const titulo = ensureString(body?.titulo);
    const observacoes = ensureString(body?.observacoes);
    const uf = ensureString(body?.uf);                // "SP", "MG", ...
    const street = ensureString(body?.street);
    const cep = ensureString(body?.cep)
      .replace(/\D/g, "")
      .replace(/^(\d{5})(\d{3})$/, "$1-$2");

    // capacidade/semLimite
    const semLimite = Boolean(body?.semLimite);
    let capacidade = Number(body?.capacidade);
    if (Number.isNaN(capacidade) || capacidade == null) capacidade = 0;
    if (semLimite) capacidade = 0;             // regra do backend: 0 quando sem limite
    if (!semLimite && capacidade < 1) capacidade = 1;

    // validações mínimas pra evitar 400 bobo no backend
    const missing: string[] = [];
    if (!MODALIDADES.has(modalidade)) missing.push("modalidade");
    if (!titulo) missing.push("titulo");
    if (!data) missing.push("data");
    if (!horario) missing.push("horario");
    if (!cep) missing.push("cep");
    if (!uf) missing.push("uf");
    if (!street) missing.push("street");

    if (missing.length) {
      return NextResponse.json(
        { code: "BAD_REQUEST", message: "Campos obrigatórios ausentes", missing },
        { status: 400 }
      );
    }

    // monta DTO exatamente como o backend espera
    const dto = {
      titulo,
      observacoes, // pode ser ""
      data,        // LocalDate
      horario,     // LocalTime HH:mm:ss
      cep,         // 00000-000
      uf,
      street,
      capacidade,  // inteiro (0 quando semLimite)
      modalidade,  // minúsculo
      semLimite,   // boolean
      // não enviamos "status" — service define como OPEN
    };

    const upstream = await fetch(`${API}/atividades`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/plain, */*",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(dto),
    });

    if (upstream.status === 201) {
      // repassa Location se o backend mandar
      const res = NextResponse.json({ ok: true }, { status: 201 });
      const loc = upstream.headers.get("Location");
      if (loc) res.headers.set("Location", loc);
      return res;
    }

    const text = await upstream.text().catch(() => "");
    let payload: any = null;
    try {
      payload = text ? JSON.parse(text) : null;
    } catch {
      payload = { raw: text };
    }

    const status =
      upstream.status >= 400 && upstream.status < 500 ? upstream.status : 502;

    return NextResponse.json(
      {
        code: "UPSTREAM_ERROR",
        message: `Backend ${upstream.status}`,
        upstreamStatus: upstream.status,
        upstreamBody: payload,
      },
      { status }
    );
  } catch (e: any) {
    return NextResponse.json(
      { code: "INTERNAL", message: e?.message ?? "Erro interno" },
      { status: 500 }
    );
  }
}
