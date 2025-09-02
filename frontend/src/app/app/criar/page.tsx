// app/app/criar/page.tsx  (ajuste o caminho conforme seu projeto)
// SEM "use client"
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import CreateActivityForm from "@/components/create-activity-form";
import { getCurrentSession } from "@/lib/auth";
import { findUserById } from "@/lib/fake-users";

export const runtime = "nodejs";

export default async function CriarAtividadePage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login?next=/app/criar");

  const user = await findUserById(session.sub);

  
  const cep = user?.cep ?? "00000-000";

  const street = user?.street ?? "Rua / complemento (automático via CEP)"
  // TypeScript pode reclamar porque defaultUF é um union de UFs; esse cast resolve:
  const uf = (user?.uf ?? "SP") as Parameters<typeof CreateActivityForm>[0]["defaultUF"];
  return (
    <main className="min-h-screen p-6">
      <div className="max-w-xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Criar atividade</h1>
          <Button asChild variant="ghost">
            <a href="/app">Voltar</a>
          </Button>
        </div>

        <CreateActivityForm
          currentUserId={session.sub}  // id do usuário logado
          defaultUF={uf}               // UF pré-carregada da sessão (fallback SP)
          defaultCEP={cep}
          defaultStreet={street}
          // sem onCreate => o componente já faz console.log/reset (simples)
        />
      </div>
    </main>
  );
}
