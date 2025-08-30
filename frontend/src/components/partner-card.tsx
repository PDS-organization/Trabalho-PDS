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
  return (
    <article className="rounded-xl border bg-card">
      <div className="p-3 sm:p-4 flex items-center">
        {/* esquerda: avatar + nome + @ */}
        <div className="flex flex-col items-center gap-3 w-56 max-w-[40%]">
          <Avatar className="h-14 w-14 ring-1 ring-border">
            <AvatarImage src={partner.avatarUrl} alt={partner.name} />
            <AvatarFallback>{partner.name.slice(0, 1).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="font-medium truncate">{partner.name}</div>
            <div className="text-sm text-muted-foreground truncate">@{partner.username}</div>
          </div>
        </div>

        <Separator orientation="vertical" className="mx-4 h-14 hidden sm:block" />

        {/* direita: esporte • hora / localização / botão */}
        <div className="flex-1 min-w-0 grid sm:grid-cols-[1fr_auto] gap-3 items-center">
          <div className="min-w-0">
            <div className="text-sm sm:text-base">
              <span className="font-medium">{partner.sport}</span>
              <span className="text-muted-foreground"> • {partner.time}</span>
            </div>
            <div className="text-sm text-muted-foreground truncate">
              {partner.bairro}, {partner.cidade} - {partner.uf}
            </div>
          </div>
          <div className="justify-self-end">
            <Button className="px-5" onClick={() => onMatch?.(partner.id)}>Simbora</Button>
          </div>
        </div>
      </div>
    </article>
  );
}
