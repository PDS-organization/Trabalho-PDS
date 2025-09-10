// data/sports.ts
import {
  basqueteIcon, boxeIcon, ciclismoIcon, corridaIcon, futebolIcon,
  musculacaoIcon, natacaoIcon, tenisIcon, voleiIcon,
} from "@/icons/sports";

export const SPORT_IDS = [
  "CORRIDA","MUSCULACAO","NATACAO","BOXE","FUTEBOL",
  "VOLEI","CICLISMO","TENIS","BASQUETE",
] as const;

export type SportId = typeof SPORT_IDS[number];

export type SportDef = {
  id: SportId;
  label: string;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  backendId: number; // 👈 novo
};

export const SPORTS: SportDef[] = [
  { id: "BASQUETE",   label: "Basquete",   Icon: basqueteIcon,   backendId: 9 },
  { id: "BOXE",       label: "Boxe",       Icon: boxeIcon,       backendId: 4 },
  { id: "CICLISMO",   label: "Ciclismo",   Icon: ciclismoIcon,   backendId: 7 },
  { id: "CORRIDA",    label: "Corrida",    Icon: corridaIcon,    backendId: 1 },
  { id: "FUTEBOL",    label: "Futebol",    Icon: futebolIcon,    backendId: 5 },
  { id: "MUSCULACAO", label: "Musculação", Icon: musculacaoIcon, backendId: 2 },
  { id: "NATACAO",    label: "Natação",    Icon: natacaoIcon,    backendId: 3 },
  { id: "TENIS",      label: "Tênis",      Icon: tenisIcon,      backendId: 8 },
  { id: "VOLEI",      label: "Vôlei",      Icon: voleiIcon,      backendId: 6 },
];
