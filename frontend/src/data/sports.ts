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
  "CORRIDA",
  "MUSCULACAO",
  "NATACAO",
  "BOXE",
  "FUTEBOL",
  "VOLEI",
  "CICLISMO",
  "TENIS",
  "BASQUETE",
] as const;

export type SportId = typeof SPORT_IDS[number];

export type SportDef = {
  id: SportId;
  label: string;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;

};

export const SPORTS: SportDef[] = [
  { id: "BASQUETE", label: "Basquete", Icon: basqueteIcon },
  { id: "BOXE", label: "Boxe", Icon: boxeIcon },
  { id: "CICLISMO", label: "Ciclismo", Icon: ciclismoIcon },
  { id: "CORRIDA", label: "Corrida", Icon: corridaIcon },
  { id: "FUTEBOL", label: "Futebol", Icon: futebolIcon },
  { id: "MUSCULACAO", label: "Musculação", Icon: musculacaoIcon },
  { id: "NATACAO", label: "Natação", Icon: natacaoIcon },
  { id: "TENIS", label: "Tênis", Icon: tenisIcon },
  { id: "VOLEI", label: "Vôlei", Icon: voleiIcon },
];
