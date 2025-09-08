// src/app/app/page.tsx
import { redirect } from "next/navigation";
import SearchPartnersForm from "@/components/search-partners-form";
import { getSessionUser } from "@/lib/session";

export default async function AppHome({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const me = await getSessionUser();
  if (!me) redirect("/login?next=/app");

  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(searchParams)) {
    if (Array.isArray(v)) v.forEach((val) => typeof val === "string" && qs.append(k, val));
    else if (typeof v === "string") qs.set(k, v);
  }
  const qsString = qs.toString();

  return (
    <main className="pt-6">
      <h1 className="text-2xl font-semibold">
        Bem-vindo{me?.name ? `, ${me.name}` : ""} 👋
      </h1>
      <p className="text-muted-foreground mt-1">Você está logado.</p>

      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-4">Buscar parceiros</h2>
        <SearchPartnersForm className="mb-6" />
        <div className="text-sm text-muted-foreground">
          {qsString
            ? `Filtros: ${qsString} (monte a listagem aqui no próximo passo)`
            : "Defina os filtros acima e clique em 'Buscar parceiros'."}
        </div>
      </div>

      <form action="/api/auth/logout" method="POST" className="mt-6">
        <button className="px-4 py-2 rounded-md border hover:bg-muted">Sair</button>
      </form>
    </main>
  );
}
