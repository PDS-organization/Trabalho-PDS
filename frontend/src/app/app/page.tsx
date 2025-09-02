import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySession } from "@/lib/jwt";
import SearchPartnersForm from "@/components/search-partners-form";

type SearchParams =
  Record<string, string | string[] | undefined>;

function serializeSearchParams(sp: SearchParams) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (Array.isArray(v)) v.forEach((val) => typeof val === "string" && qs.append(k, val));
    else if (typeof v === "string") qs.set(k, v);
  }
  return qs.toString();
}

export default async function AppHome({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("sb:session")?.value ?? null;
  const session = await verifySession<{ name?: string }>(token);
  if (!session) redirect("/login?next=/app");

  const sp = searchParams;
  const qsString = serializeSearchParams(sp);

  return (
    <main className=" pt-6">
      <h1 className="text-2xl font-semibold">
        Bem-vindo{session?.name ? `, ${session.name}` : ""} 👋
      </h1>
      <p className="text-muted-foreground mt-1">Você está logado.</p>

      <div>
        <h2 className="text-xl font-semibold mb-4">Buscar parceiros</h2>
        <SearchPartnersForm className="mb-6" />

        <div className="text-sm text-muted-foreground">
          {qsString
            ? `Filtros: ${qsString} (monte a listagem aqui no próximo passo)`
            : "Defina os filtros acima e clique em 'Buscar parceiros'."}
        </div>
      </div>

      <form action="/api/fake/logout" method="POST" className="mt-6">
        <button className="px-4 py-2 rounded-md border hover:bg-muted">
          Sair
        </button>
      </form>
    </main>
  );
}
