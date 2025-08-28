import { SPORTS, type SportId } from "@/data/sports";

export type SignupPayloadUI = {
  name: string;
  email: string;
  password: string;
  username: string;
  birthdate: string;
  gender: "masculino" | "feminino" | "nao_informar" | "outro";
  phone: string;
  cep: string;
  uf: string;
  street: string;
  sports: SportId[];
};

export type SignupPayloadAPI = {
  name: string;
  genero: string;
  userName: string;
  email: string;
  dataNascimento: string;
  password: string;
  phone: string;
  cep: string;
  uf: string;
  street: string;
  modalidadesNomes: string[];
};

const GENDER_MAP = {
  masculino: "MASCULINO",
  feminino: "FEMININO",
  outro: "OUTRO",
  nao_informar: "NAO_INFORMAR",
} as const;

function sportIdsToNames(ids: SportId[]) {
  return ids
    .map((id) => SPORTS.find((s) => s.id === id)?.label || id)
    .filter(Boolean);
}

export function toSignupDTO(v: SignupPayloadUI): SignupPayloadAPI {
  return {
    name: v.name,
    genero: GENDER_MAP[v.gender],
    userName: v.username,
    email: v.email,
    dataNascimento: v.birthdate,          // "YYYY-MM-DD"
    password: v.password,
    phone: v.phone,
    cep: v.cep.replace(/\D/g, ""),        // só dígitos
    uf: v.uf.toUpperCase(),
    street: v.street,
    modalidadesNomes: sportIdsToNames(v.sports),
  };
}
