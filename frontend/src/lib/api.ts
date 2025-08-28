import { api } from "./http";
import { toSignupDTO, type SignupPayloadUI } from "./mappers";

export async function signup(values: SignupPayloadUI) {
  return api<{ id: string }>("/users", {
    method: "POST",
    body: JSON.stringify(toSignupDTO(values)),
  });
}

export async function checkUsername(u: string) {
  return api<{ available: boolean }>(`/api/users/check-username?u=${encodeURIComponent(u)}`);
}
