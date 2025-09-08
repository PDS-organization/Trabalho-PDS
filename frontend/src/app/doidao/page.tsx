// src/app/doidao/page.tsx
import { cookies } from "next/headers";

export const dynamic = "force-dynamic"; // evita cache agressivo

async function readBodyAny(res: Response) {
  const txt = await res.text().catch(() => "");
  try {
    return JSON.stringify(JSON.parse(txt), null, 2);
  } catch {
    return txt || "<vazio>";
  }
}

export default async function DoidaoPage() {
  const origin = process.env.NEXT_PUBLIC_APP_ORIGIN || "http://localhost:3000";

  // 👇 Next 15: cookies() precisa de await
  const ck = await cookies();
  const cookieHeader = ck.toString();

  // mascara apenas o valor do sb_session
  const maskedCookie = cookieHeader.replace(
    /(sb_session=)([^;]+)/,
    (_, a, b) => a + (b.length > 10 ? b.slice(0, 10) + "…(masked)" : "…(masked)")
  );

  // ── 1) SSR: fetch SEM propagar cookie ────────────────────────────────────
  let statusNoCookie = -1;
  let bodyNoCookie = "";
  try {
    const resNoCookie = await fetch(`${origin}/api/auth/me`, { cache: "no-store" });
    statusNoCookie = resNoCookie.status;
    bodyNoCookie = await readBodyAny(resNoCookie); // mostra mesmo se erro
  } catch (e: any) {
    bodyNoCookie = String(e?.message ?? e);
  }

  // ── 2) SSR: fetch COM cookie propagado ───────────────────────────────────
  let statusWithCookie = -1;
  let bodyWithCookie = "";
  try {
    const headers: HeadersInit = {};
    if (cookieHeader) (headers as Record<string, string>).cookie = cookieHeader;

    const resWithCookie = await fetch(`${origin}/api/auth/me`, {
      cache: "no-store",
      headers,
    });
    statusWithCookie = resWithCookie.status;
    bodyWithCookie = await readBodyAny(resWithCookie); // mostra mesmo se erro
  } catch (e: any) {
    bodyWithCookie = String(e?.message ?? e);
  }

  return (
    <main className="max-w-3xl mx-auto py-8 space-y-6">
      <h1 className="text-2xl font-semibold">Debug /api/auth/me</h1>

      <section className="p-4 border rounded-md">
        <h2 className="font-semibold mb-2">Cookies vistos no SSR</h2>
        <pre className="whitespace-pre-wrap text-sm">
          {maskedCookie || "<sem cookies>"}
        </pre>
      </section>

      <section className="p-4 border rounded-md">
        <h2 className="font-semibold mb-2">SSR → fetch sem cookie</h2>
        <div className="text-sm">
          GET {origin}/api/auth/me — Status: <b>{statusNoCookie}</b>
        </div>
        <pre className="whitespace-pre-wrap text-xs mt-2">
{bodyNoCookie}
        </pre>
      </section>

      <section className="p-4 border rounded-md">
        <h2 className="font-semibold mb-2">SSR → fetch com cookie propagado</h2>
        <div className="text-sm">
          GET {origin}/api/auth/me — Status: <b>{statusWithCookie}</b>
        </div>
        <pre className="whitespace-pre-wrap text-xs mt-2">
{bodyWithCookie}
        </pre>
      </section>
    </main>
  );
}
