"use client";

import useSWR from "swr";
import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
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

  // chave estável para o SWR
  const key = useMemo(() => `/api/fake/search-partners?${qs.toString()}`, [qs]);

  const { data, error, isLoading } = useSWR<ApiResp>(key, fetcher);

  const header = useMemo(() => {
    const date = qs.get("date") ?? "";
    const time = qs.get("time") ?? "";
    const d = parseYMD(date);
    if (!d) return "Resultados";
    const weekday = new Intl.DateTimeFormat("pt-BR", { weekday: "long" }).format(d);
    const dayMonth = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(d);
    return `${cap(weekday)}, ${dayMonth} — ${time}`;
  }, [qs]);

  return (
    <main className="min-h-screen p-4">
      <div className="app-container mb-4 flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
      </div>

      <div className="app-container space-y-4">
        <h2 className="text-xl sm:text-2xl font-semibold">{header}</h2>

        {isLoading && <p className="text-sm text-muted-foreground">Carregando parceiros…</p>}
        {error && <p className="text-sm text-rose-600">Falha ao buscar parceiros.</p>}
        {!isLoading && !error && (!data?.results?.length ? (
          <p className="text-sm text-muted-foreground">Nenhum parceiro encontrado para esses filtros.</p>
        ) : (
          <ul className="space-y-3">
            {data!.results.map((p) => (
              <li key={p.id}>
                <PartnerCard
                  partner={p}
                  onMatch={(id) => {
                    // aqui você chama POST /api/fake/match ou similar
                    console.log("match com", id);
                  }}
                />
              </li>
            ))}
          </ul>
        ))}
      </div>
    </main>
  );
}
