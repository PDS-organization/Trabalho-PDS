"use client";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

export type Partner = {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string;
  sport: string;   // ex: "futebol"
  time: string;    // "HH:mm"
  bairro: string;
  cidade: string;
  uf: string;
};

export default function PartnerCard({
  partner,
  onMatch,
}: {
  partner: Partner;
  onMatch?: (id: string) => void;
}) {
  // Helper para gerar iniciais do nome de forma segura
  const getInitials = (name: string) => {
    if (!name || typeof name !== 'string') return '?';
    return name.trim().charAt(0).toUpperCase() || '?';
  };

  // Validações básicas dos dados
  const safeName = partner.name || 'Nome não informado';
  const safeUsername = partner.username || 'username';
  const safeSport = partner.sport || 'Esporte';
  const safeTime = partner.time || '00:00';
  const safeBairro = partner.bairro || 'Bairro';
  const safeCidade = partner.cidade || 'Cidade';
  const safeUf = partner.uf || 'UF';

  return (
    <article className="rounded-xl border bg-card hover:shadow-md transition-shadow">
      <div className="p-3 sm:p-4 flex items-center">
        {/* Esquerda: avatar + nome + @ */}
        <div className="flex flex-col items-center gap-3 w-56 max-w-[40%]">
          <Avatar className="h-14 w-14 ring-1 ring-border">
            <AvatarImage src={partner.avatarUrl} alt={safeName} />
            <AvatarFallback className="bg-primary/10 text-primary font-medium">
              {getInitials(safeName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 text-center">
            <div className="font-medium truncate" title={safeName}>
              {safeName}
            </div>
            <div className="text-sm text-muted-foreground truncate" title={`@${safeUsername}`}>
              @{safeUsername}
            </div>
          </div>
        </div>

        <Separator orientation="vertical" className="mx-4 h-14 hidden sm:block" />

        {/* Direita: esporte • hora / localização / botão */}
        <div className="flex-1 min-w-0 grid sm:grid-cols-[1fr_auto] gap-3 items-center">
          <div className="min-w-0">
            <div className="text-sm sm:text-base">
              <span className="font-medium capitalize">{safeSport}</span>
              <span className="text-muted-foreground"> • {safeTime}</span>
            </div>
            <div 
              className="text-sm text-muted-foreground truncate"
              title={`${safeBairro}, ${safeCidade} - ${safeUf}`}
            >
              {safeBairro}, {safeCidade} - {safeUf}
            </div>
          </div>
          <div className="justify-self-end">
            <Button 
              className="px-5" 
              onClick={() => onMatch?.(partner.id)}
              disabled={!partner.id}
            >
              Simbora
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}