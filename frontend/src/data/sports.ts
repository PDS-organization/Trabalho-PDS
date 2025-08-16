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

export type SportId = typeof SPORT_IDS[number];

export type SportDef = {
  id: SportId;
  label: string;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;

};

export const SPORTS: SportDef[] = [
  { id: "basquete", label: "Basquete", Icon: basqueteIcon },
  { id: "boxe", label: "Boxe", Icon: boxeIcon },
  { id: "ciclismo", label: "Ciclismo", Icon: ciclismoIcon },
  { id: "corrida", label: "Corrida", Icon: corridaIcon },
  { id: "futebol", label: "Futebol", Icon: futebolIcon },
  { id: "musculacao", label: "Musculação", Icon: musculacaoIcon },
  { id: "natacao", label: "Natação", Icon: natacaoIcon },
  { id: "tenis", label: "Tênis", Icon: tenisIcon },
  { id: "volei", label: "Vôlei", Icon: voleiIcon },
  { id: "volei", label: "Vôlei", Icon: voleiIcon },
  { id: "volei", label: "Vôlei", Icon: voleiIcon },
  { id: "volei", label: "Vôlei", Icon: voleiIcon },


];
