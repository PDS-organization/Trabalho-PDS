// BuscarPage.tsx atualizado
"use client";

import useSWR from "swr";
import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, MapPin } from "lucide-react";
import PartnerCard, { type Partner } from "@/components/partner-card";

type ApiResp = { ok: boolean; results: Partner[] };

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<ApiResp>;
};

function parseYMD(s?: string) {
  if (!s) return undefined;
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d);
}

function cap(s: string) {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

export default function BuscarPage() {
  const router = useRouter();
  const qs = useSearchParams();

  // Chave estável para o SWR
  const key = useMemo(() => `/api/fake/search-partners?${qs.toString()}`, [qs]);

  const { data, error, isLoading } = useSWR<ApiResp>(key, fetcher);

  // Header melhorado com range de horários
  const header = useMemo(() => {
    const date = qs.get("date") ?? "";
    const time = qs.get("time") ?? "";
    const sports = qs.getAll("sports");

    const d = parseYMD(date);
    if (!d) return "Resultados da busca";

    const weekday = new Intl.DateTimeFormat("pt-BR", { weekday: "long" }).format(d);
    const dayMonth = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(d);

    let sportText = "";
    if (sports.length === 1) {
      sportText = cap(sports[0]);
    } else if (sports.length > 1) {
      sportText = `${sports.length} esportes`;
    }

    let timeText = "";
    if (time) {
      timeText = ` a partir das ${time}`;
    }

    return `${sportText}${timeText} - ${cap(weekday)}, ${dayMonth}`;
  }, [qs]);

  // Info da busca para exibição
  const searchInfo = useMemo(() => {
    const cep = qs.get("cep");
    const time = qs.get("time");
    const sports = qs.getAll("sports");

    return {
      cep: cep || null,
      time: time || null,
      sportsCount: sports.length,
      hasFilters: !!(cep || time || sports.length),
    };
  }, [qs]);

  const handleMatch = async (partnerId: string) => {
    try {
      const response = await fetch("/api/fake/matches", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          activityId: partnerId, // ID da atividade
          requesterId: "user-009", // TODO: pegar do contexto/sessão
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Mostra mensagem de sucesso
        alert(data.message);
        // TODO: Implementar toast ou notification mais elegante
      } else {
        alert(data.error || "Erro ao solicitar match");
      }
    } catch (error) {
      console.error("Erro na requisição de match:", error);
      alert("Erro ao conectar com o servidor");
    }
  };

  return (
    <main className="min-h-screen p-4">
      {/* Header com botão voltar */}
      <div className="app-container mb-4 flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
      </div>

      <div className="app-container space-y-4">
        {/* Título da busca */}
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold">{header}</h2>

          {/* Info adicional da busca */}
          {searchInfo.hasFilters && (
            <div className="mt-2 flex flex-wrap gap-2 text-sm text-muted-foreground">
              {searchInfo.cep && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  Próximo ao {searchInfo.cep}
                </span>
              )}
              {searchInfo.time && (
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  A partir das {searchInfo.time}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Estados de loading/erro */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Buscando atividades próximas…</p>
            </div>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-sm text-rose-600 mb-2">Falha ao buscar atividades.</p>
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
              Tentar novamente
            </Button>
          </div>
        )}

        {/* Resultados */}
        {!isLoading && !error && (
          <>
            {!data?.results?.length ? (
              <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
                <div className="text-4xl">🤷‍♂️</div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Nenhuma atividade encontrada para esses critérios.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Tente expandir o horário ou alterar a localização.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => router.back()}>
                    Nova busca
                  </Button>
                  <Button variant="ghost" onClick={() => router.push("/app/criar")}>
                    Criar atividade
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Contador de resultados */}
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {data.results.length} atividade{data.results.length !== 1 ? "s" : ""} encontrada{data.results.length !== 1 ? "s" : ""}
                    {searchInfo.time && " a partir das " + searchInfo.time}
                  </p>
                  <Button variant="outline" size="sm" onClick={() => router.back()}>
                    Refinar busca
                  </Button>
                </div>

                {/* Lista de atividades */}
                <ul className="space-y-3">
                  {data.results.map((partner) => (
                    <li key={partner.id}>
                      <PartnerCard
                        partner={partner}
                        onMatch={handleMatch}
                      />
                    </li>
                  ))}
                </ul>

                {/* Footer com dicas */}
                {data.results.length > 0 && (
                  <div className="text-center pt-4">
                    <p className="text-xs text-muted-foreground">
                      Clique em "Simbora" para solicitar participação na atividade
                    </p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}