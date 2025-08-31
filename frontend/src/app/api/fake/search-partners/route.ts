// /api/fake/search-partners/route.ts
import { NextResponse } from "next/server";
import path from "node:path";
import { readJsonl } from "@/lib/fake-db";

export const runtime = "nodejs";
const ACTIVITIES_FILE = path.join(process.cwd(), "src", "data", "fake_activities.jsonl");
const USERS_FILE = path.join(process.cwd(), "src", "data", "fake_users.jsonl");

// Função para calcular proximidade por CEP
function calculateCEPProximity(cep1: string, cep2: string): number {
  const clean1 = cep1.replace(/\D/g, "");
  const clean2 = cep2.replace(/\D/g, "");
  
  if (clean1.length !== 8 || clean2.length !== 8) return 999999;
  
  const prefix1 = parseInt(clean1.slice(0, 5));
  const prefix2 = parseInt(clean2.slice(0, 5));
  
  return Math.abs(prefix1 - prefix2);
}

// Função para comparar horários
function isTimeAfterOrEqual(activityTime: string, searchTime: string): boolean {
  const [ah, am] = activityTime.split(":").map(Number);
  const [sh, sm] = searchTime.split(":").map(Number);
  
  const activityMinutes = ah * 60 + am;
  const searchMinutes = sh * 60 + sm;
  
  return activityMinutes >= searchMinutes;
}

// Função para extrair informações do endereço
function parseAddress(activityStreet: string, uf: string, userStreet?: string) {
  // Tenta extrair da atividade primeiro, depois do usuário
  const street = activityStreet || userStreet || "";
  const parts = street.split(",").map(s => s.trim());
  
  let bairro = "";
  let cidade = "";
  
  if (parts.length >= 2) {
    bairro = parts[1].split("-")[0]?.trim() || "";
    cidade = parts[2]?.trim() || parts[1].split("-")[1]?.trim() || "";
  }
  
  // Fallbacks baseados no UF e CEP
  if (!cidade) {
    const cidadesPorUF: Record<string, string> = {
      "MG": "Uberlândia",
      "SP": "São Paulo", 
      "RJ": "Rio de Janeiro",
      "GO": "Itumbiara", // Baseado nos CEPs 75530-xxx
    };
    cidade = cidadesPorUF[uf] || "Cidade";
  }
  
  if (!bairro) {
    bairro = "Centro"; // fallback padrão
  }
  
  return { bairro, cidade };
}

export async function GET(req: Request) {
  try {
    const u = new URL(req.url);
    const sports = u.searchParams.getAll("sports").filter(Boolean);
    const cep = u.searchParams.get("cep") ?? "";
    const date = u.searchParams.get("date") ?? "";
    const time = u.searchParams.get("time") ?? "";

    const activities = await readJsonl<any>(ACTIVITIES_FILE);
    const users = await readJsonl<any>(USERS_FILE);
    
    // Cria mapa de usuários para lookup rápido
    const usersMap = new Map(users.map((u: any) => [u.id, u]));

    const now = new Date();
    const cepPrefix = cep.replace(/\D/g, "").slice(0, 5);

    // Filtra e processa atividades
    let results = activities
      .filter((activity) => {
        if (activity.status !== "open") return false;

        if (sports.length && !sports.includes(activity.sport)) return false;

        if (date && activity.date !== date) return false;

        // 4. Filtro por horário - A PARTIR DO HORÁRIO ESPECIFICADO
        if (time && !isTimeAfterOrEqual(activity.time, time)) return false;

        // 5. Se não tem data/time na busca, só atividades futuras
        if (!date || !time) {
          const [ay, am, ad] = activity.date.split("-").map(Number);
          const [ah, an] = activity.time.split(":").map(Number);
          const activityDateTime = new Date(ay, am - 1, ad, ah, an);
          if (activityDateTime.getTime() <= now.getTime()) return false;
        }

        if (cepPrefix) {
          const proximity = calculateCEPProximity(cep, activity.cep);
          if (proximity > 100) return false;
        }

        // 7. Verifica se ainda tem vagas
        const currentParticipants = activity.participants?.length || 0;
        if (activity.capacity && currentParticipants >= activity.capacity) return false;

        return true;
      })
      .map((activity) => {
        // Busca dados do criador da atividade
        const creator = usersMap.get(activity.creatorId) || {
          name: "Usuário",
          username: "user",
          avatarUrl: "",
        };

        // Extrai informações de localização (atividade + usuário)
        const { bairro, cidade } = parseAddress(activity.street, activity.uf, creator.street);
        
        // Calcula proximidade para ordenação
        const proximity = cepPrefix ? calculateCEPProximity(cep, activity.cep) : 0;

        return {
          id: activity.id,
          name: creator.name || "Usuário Anônimo",
          username: creator.username || "usuario",
          avatarUrl: `https://i.pravatar.cc/150?u=${creator.id || activity.creatorId}`,
          sport: activity.sport,
          time: activity.time,
          bairro: bairro,
          cidade: cidade,
          uf: activity.uf,
          // Dados extras para ordenação
          _proximity: proximity,
          _capacity: activity.capacity,
          _participants: activity.participants?.length || 0,
        };
      })
      // Ordena por proximidade, depois por horário
      .sort((a, b) => {
        if (a._proximity !== b._proximity) {
          return a._proximity - b._proximity;
        }
        return a.time.localeCompare(b.time);
      })
      // Remove campos internos
      .map(({ _proximity, _capacity, _participants, ...partner }) => partner);

    return NextResponse.json({ ok: true, results }, { status: 200 });
    
  } catch (error) {
    console.error("Erro na busca de parceiros:", error);
    return NextResponse.json(
      { ok: false, error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}