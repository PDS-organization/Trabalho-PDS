"use client";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { MapPin, Clock, Loader2 } from "lucide-react";
import { SPORTS, type SportId } from "@/data/sports";

export type Partner = {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string;
  sport: string;   // ex: "futebol" — deve casar com SPORTS.id
  time: string;    // "HH:mm"
  bairro: string;
  cidade: string;
  uf: string;
};

export default function PartnerCard({
  partner,
  onMatch,
  loading = false,
  disabled = false,
}: {
  partner: Partner;
  onMatch?: (id: string) => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  const getInitials = (name: string) => {
    if (!name || typeof name !== "string") return "?";
    return name.trim().charAt(0).toUpperCase() || "?";
  };

  const safeName = partner.name || "Nome não informado";
  const safeUsername = partner.username || "username";
  const safeSport = (partner.sport || "esporte").toLowerCase();
  const safeTime = partner.time || "00:00";
  const safeBairro = partner.bairro || "Bairro";
  const safeCidade = partner.cidade || "Cidade";
  const safeUf = partner.uf || "UF";

  const sportDef = SPORTS.find((s) => s.id === (safeSport as SportId));
  const SportIcon = sportDef?.Icon;

  return (
    <article
      className={[
        "w-full max-w-full rounded-2xl border bg-card/60 shadow-sm",
        "transition-shadow duration-200 hover:shadow-md",
      ].join(" ")}
    >
      <div className="w-full p-4 flex flex-col gap-4 sm:flex-row sm:items-center">
        {/* Avatar + nome (sem width fixo) */}
        <div className="flex items-center gap-3 min-w-0">
          <Avatar className="h-12 w-12 ring-1 ring-border">
            <AvatarImage src={partner.avatarUrl} alt={safeName} />
            <AvatarFallback className="bg-primary/10 text-primary font-medium">
              {getInitials(safeName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="font-medium truncate" title={safeName}>
              {safeName}
            </div>
            <div
              className="text-sm text-muted-foreground truncate"
              title={`@${safeUsername}`}
            >
              @{safeUsername}
            </div>
          </div>
        </div>

        <Separator orientation="vertical" className="hidden sm:block h-12" />

        {/* Centro (segura overflow do conteúdo) */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs sm:text-sm bg-background/50"
              title={`Esporte: ${safeSport}`}
            >
              {SportIcon ? <SportIcon className="h-4 w-4 shrink-0" /> : null}
              <span className="capitalize">{safeSport}</span>
            </span>

            <span
              className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs sm:text-sm bg-background/50"
              title={`Horário: ${safeTime}`}
            >
              <Clock className="h-3.5 w-3.5" />
              {safeTime}
            </span>
          </div>

          <div
            className="flex items-start gap-2 text-sm text-muted-foreground truncate"
            title={`${safeBairro}, ${safeCidade} - ${safeUf}`}
          >
            <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="truncate">
              {safeBairro}, {safeCidade} - {safeUf}
            </span>
          </div>
        </div>

        {/* Botão */}
        <div className="sm:justify-self-end">
          <Button
            className="px-5"
            onClick={() => onMatch?.(partner.id)}
            disabled={disabled || loading || !partner.id}
            aria-label={`Entrar na atividade de ${safeSport} às ${safeTime}`}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Simbora"
            )}
          </Button>
        </div>
      </div>
    </article>
  );
}
