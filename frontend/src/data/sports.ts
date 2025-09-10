// data/sports.ts
import {
  basqueteIcon,
  boxeIcon,
  ciclismoIcon,
  corridaIcon,
  futebolIcon,
  musculacaoIcon,
  natacaoIcon,
  tenisIcon,
  voleiIcon,
} from "@/icons/sports";

export const SPORT_IDS = [
  "corrida",
  "musculacao",
  "natacao",
  "boxe",
  "futebol",
  "volei",
  "ciclismo",
  "tenis",
  "basquete",
] as const;

export type SportId = (typeof SPORT_IDS)[number];

export type SportDef = {
  id: SportId;
  label: string;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  backendId: number; // id da modalidade no backend
};

export const SPORTS: SportDef[] = [
  { id: "basquete",   label: "Basquete",   Icon: basqueteIcon,   backendId: 9 },
  { id: "boxe",       label: "Boxe",       Icon: boxeIcon,       backendId: 4 },
  { id: "ciclismo",   label: "Ciclismo",   Icon: ciclismoIcon,   backendId: 7 },
  { id: "corrida",    label: "Corrida",    Icon: corridaIcon,    backendId: 1 },
  { id: "futebol",    label: "Futebol",    Icon: futebolIcon,    backendId: 5 },
  { id: "musculacao", label: "Musculação", Icon: musculacaoIcon, backendId: 2 },
  { id: "natacao",    label: "Natação",    Icon: natacaoIcon,    backendId: 3 },
  { id: "tenis",      label: "Tênis",      Icon: tenisIcon,      backendId: 8 },
  { id: "volei",      label: "Vôlei",      Icon: voleiIcon,      backendId: 6 },
];




