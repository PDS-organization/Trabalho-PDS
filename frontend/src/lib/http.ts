const API = process.env.NEXT_PUBLIC_API_BASE_URL!;
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const r = await fetch(`${API}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  const txt = await r.text();
  const data = txt ? JSON.parse(txt) : null;
  if (!r.ok) throw new Error(data?.message || data?.error || `HTTP ${r.status}`);
  return data as T;
}
