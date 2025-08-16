export type SignupPayload = {
  name: string;
  email: string;
  password: string;
  acceptTerms: boolean;
};

// Troque a URL quando o backend Java estiver pronto
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export async function signup(payload: SignupPayload): Promise<{ ok: true } | { ok: false; message: string }> {
  // MODO DEV: simular sucesso/erro localmente
  if (process.env.NEXT_PUBLIC_USE_FAKE_API === "true") {
    await new Promise((r) => setTimeout(r, 800));
    // Simule um erro se e-mail já “existe”
    if (payload.email.toLowerCase() === "existe@exemplo.com") {
      return { ok: false, message: "E-mail já cadastrado" };
    }
    return { ok: true };
  }

  // INTEGRAÇÃO REAL NO FUTURO (exemplo)
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return { ok: false, message: data?.message ?? "Falha ao cadastrar" };
  }
  return { ok: true };
}
