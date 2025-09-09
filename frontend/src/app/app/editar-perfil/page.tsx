// Server Component
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import EditProfileForm from "@/components/edit-profile-form";
import { getSessionUser } from "@/lib/session";

export const runtime = "nodejs";

export default async function EditarPerfilPage() {
  const me = await getSessionUser();
  if (!me) redirect("/login?next=/app/perfil/editar");

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Editar perfil</h1>
          <Button asChild variant="ghost">
            <a href="/app">Voltar</a>
          </Button>
        </div>

        {/* me deve ter: { id, email, username, name?, phone?, dataNascimento?, modalidades? } */}
        <EditProfileForm me={me as any} />
      </div>
    </main>
  );
}
