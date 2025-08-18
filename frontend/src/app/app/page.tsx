import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySession } from "@/lib/jwt";

export default async function AppHome() {
  const cookieStore = await cookies();
  const token = cookieStore.get("sb:session")?.value ?? null;
  const session = await verifySession<{ name?: string }>(token);
  if (!session) redirect("/login?next=/app");

  return (
    <main className="min-h-screen pt-6">
      <h1 className="text-2xl font-semibold">Bem-vindo{session.name ? `, ${session.name}` : ""} 👋</h1>
      <p className="text-muted-foreground mt-1">Você está logado.</p>

      <form action="/api/fake/logout" method="POST" className="mt-6">
        <button className="px-4 py-2 rounded-md border hover:bg-muted">
          Sair
        </button>
      </form>
    </main>
  );
}
