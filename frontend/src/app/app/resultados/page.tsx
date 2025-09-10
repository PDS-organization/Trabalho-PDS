// app/resultados/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import PartnerCard, { type Partner } from "@/components/partner-card"; // ajuste o path se for diferente
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

type Atividade = {
  id: string;
  titulo: string;
  observacoes?: string | null;
  data: string;        // "YYYY-MM-DD"
  horario: string;     // "HH:mm:ss"
  cep: string;
  street: string;
  status: string;      // "OPEN" | ...
  capacidade: number;
  semLimite: boolean;
  criadorNome: string;
  modalidadeNome: string; // minúsculo
  participantesCount: number;
};

type PageResponse = {
  content: Atividade[];
  currentPage: number;
  totalElements: number;
  totalPages: number;
};

function hhmm(s: string) {
  return (s || "").slice(0, 5);
}

export default function ResultadosPage() {
  const router = useRouter();
  const [data, setData] = useState<PageResponse | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("resultadosAtividades");
      if (raw) setData(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, []);

  const partners: Partner[] = useMemo(() => {
    if (!data) return [];
    return data.content.map((a) => ({
      id: a.id,
      name: a.criadorNome || "Organizador",
      username: (a.criadorNome || "user").toLowerCase().replace(/\s+/g, ""),
      avatarUrl: undefined, // se tiver no futuro, mapeia aqui
      sport: a.modalidadeNome, // deve casar com SPORTS.id
      time: hhmm(a.horario),
      // não temos bairro/cidade/uf → componho algo agradável com o que existe
      bairro: a.street || "Local a definir",
      cidade: `CEP ${a.cep}`,
      uf: "",
    }));
  }, [data]);

  async function handleMatch(id: string) {
    try {
      setPendingId(id);

      const res = await fetch(`/api/atividades/${id}/inscrever`, {
        method: "POST",
        credentials: "include",
        headers: { Accept: "application/json" },
      });

      if (res.status === 204) {
        toast.success("Sucesso!", {description: "Você entrou na atividades!"});
      }

      let detail = "";
      try {
        detail = await res.text();
      } catch {}
        toast.error("Erro", { description: "Tente novamente." });

    } catch (e: any) {
       toast.error("Erro", { description: "Tente novamente." });
    } finally {
      setPendingId(null);
    }
  }

  if (!data) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-6 space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar
          </Button>
          <h1 className="text-xl font-semibold">Resultados</h1>
        </div>
        <p className="text-muted-foreground">
          Nada para mostrar. Volte e faça uma busca.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-6 space-y-4">
      <div className="flex justify-between items-center gap-3">
        <h1 className="text-xl font-semibold">Resultados</h1>
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Voltar
        </Button>
      </div>

      <div className="text-sm text-muted-foreground">
        Página {data.currentPage + 1} de {data.totalPages} — {data.totalElements} resultado(s)
      </div>

      <ul className="grid gap-3">
        {partners.map((p) => (
          <li key={p.id}>
            <PartnerCard
              partner={p}
              onMatch={async (id) => {
                if (pendingId) return;
                await handleMatch(id);
              }}
            />
            {/* botão fica desabilitado enquanto pendingId === p.id;
                se quiser desabilitar no card, adicione uma prop opcional ao card e passe aqui */}
            {pendingId === p.id ? (
              <div className="mt-2 text-xs text-muted-foreground">Processando…</div>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
