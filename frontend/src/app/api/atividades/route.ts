// app/api/atividades/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

const SPORT_TO_NOME: Record<string, string> = {
  BASQUETE: "BASQUETE",
  BOXE: "BOXE",
  CICLISMO: "CICLISMO",
  CORRIDA: "CORRIDA",
  FUTEBOL: "FUTEBOL",
  MUSCULACAO: "MUSCULACAO",
  NATACAO: "NATACAO",
  TENIS: "TENIS",
  VOLEI: "VOLEI",
};

const SPORT_LABEL: Record<string, string> = {
  BASQUETE: "Basquete",
  BOXE: "Boxe",
  CICLISMO: "Ciclismo",
  CORRIDA: "Corrida",
  FUTEBOL: "Futebol",
  MUSCULACAO: "Musculação",
  NATACAO: "Natação",
  TENIS: "Tênis",
  VOLEI: "Vôlei",
};

function ensureString(v: unknown): string {
  return (v ?? "").toString().trim();
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // pegue seu JWT de onde você salvou (ajuste o nome do cookie conforme seu app)
    const token = (await cookies()).get("sb_session")?.value;
    if (!token) {
      return NextResponse.json({ code: "UNAUTHENTICATED" }, { status: 401 });
    }

    // ---- mapeia/valida campos vindos do form
    const sport = ensureString(body?.sport);
    const modalidade = SPORT_TO_NOME[sport];
    if (!modalidade) {
      return NextResponse.json(
        { code: "BAD_REQUEST", message: "Sport inválido" },
        { status: 400 }
      );
    }

    const date = ensureString(body?.date); // YYYY-MM-DD
    const time = ensureString(body?.time); // HH:mm ou HH:mm:ss
    const horario = time.length === 5 ? `${time}:00` : time; // LocalTime precisa HH:mm:ss

    const titulo =
      ensureString(body?.title) || `Atividade de ${SPORT_LABEL[sport]}`;

    const cep = ensureString(body?.cep)
      .replace(/\D/g, "")
      .replace(/^(\d{5})(\d{3})$/, "$1-$2");

    const uf = ensureString(body?.uf);
    const street = ensureString(body?.street);
    const notes = ensureString(body?.notes);

    // capacidade/semLimite: DTO exige @NotNull em ambos
    const capacityRaw = body?.capacity;
    const semLimite = capacityRaw === null || capacityRaw === undefined;
    // backend exige Integer não-nulo -> se sem limite, manda 0
    const capacidade: number =
      semLimite ? 0 : Number.isFinite(Number(capacityRaw)) ? Number(capacityRaw) : 0;

    // validações mínimas do lado do edge (para evitar 400 desnecessário do backend)
    const missing: string[] = [];
    if (!titulo) missing.push("titulo");
    if (!date) missing.push("data");
    if (!horario) missing.push("horario");
    if (!cep) missing.push("cep");
    if (!uf) missing.push("uf");
    if (!street) missing.push("street");
    if (!modalidade) missing.push("modalidade");

    if (missing.length) {
      return NextResponse.json(
        { code: "BAD_REQUEST", message: "Campos obrigatórios ausentes", missing },
        { status: 400 }
      );
    }

    // monta DTO exatamente como o backend espera
    const dto = {
      titulo,
      observacoes: notes || "", // @Size(max=500) — pode ser string vazia
      data: date,               // LocalDate
      horario,                  // LocalTime (HH:mm:ss)
      cep,                      // @Pattern 00000-000
      uf,                       // @Pattern UF
      street,                   // @NotBlank
      capacidade,               // @NotNull (0 quando sem limite)
      modalidade,               // nome da modalidade
      semLimite,                // @NotNull
      // NÃO enviar "status" — o service define como OPEN
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
