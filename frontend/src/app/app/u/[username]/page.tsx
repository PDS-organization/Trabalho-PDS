// app/app/u/[username]/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SPORTS, type SportId } from "@/data/sports";

type UserResponse = {
  id: string;
  name: string;
  email: string;
  username: string;
  genero?: string;
  phone?: string;
  modalidades?: string[];
};

export const dynamic = "force-dynamic";

function generoLabel(g?: string) {
  if (!g) return "-";
  const t = g.toUpperCase();
  if (t === "MASCULINO") return "Masculino";
  if (t === "FEMININO") return "Feminino";
  return t.charAt(0) + t.slice(1).toLowerCase();
}

export default async function PerfilPage({ params }: { params: { username: string } }) {
  const token = (await cookies()).get("sb_session")?.value;
  if (!token) redirect(`/login?next=/app/u/${params.username}`);

  const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

  const res = await fetch(`${API}/users/${encodeURIComponent(params.username)}`, {
    headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (res.status === 401) redirect(`/login?next=/app/u/${params.username}`);
  if (res.status === 404) redirect("/app");
  if (!res.ok) redirect("/app");

  const user = (await res.json()) as UserResponse;

  const sportDefs = (user.modalidades ?? [])
    .map((id) => SPORTS.find((s) => s.id === (id as SportId)) || null)
    .filter(Boolean) as typeof SPORTS;

  const initial = (user.name ?? user.email ?? user.username ?? "U")
    .toString()
    .trim()
    .slice(0, 1)
    .toUpperCase();

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-5 sm:py-6">
      {/* Topbar */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-lg font-semibold sm:text-xl">Perfil</h1>
        <Button asChild variant="outline" size="sm" className="h-9 px-3">
          <Link href="/app">Voltar</Link>
        </Button>
      </div>

      {/* Cabeçalho do perfil (mobile-first: empilha) */}
      <section className="flex items-start gap-3">
        <Avatar className="h-14 w-14 sm:h-16 sm:w-16 ring-1 ring-border">
          <AvatarImage alt={user.name} />
          <AvatarFallback className="text-base sm:text-lg">{initial}</AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <h2 className="text-base sm:text-lg font-semibold leading-tight truncate">
            {user.name ?? "(sem nome)"}
          </h2>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="text-xs px-2 py-0.5">@{user.username}</Badge>
          </div>
        </div>
      </section>

      {/* Card de informações */}
      <Card className="mt-5 border-muted">
        <CardContent className="p-4 sm:p-5">
          {/* Informações principais */}
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5 text-[0.92rem]">
            <div className="space-y-1">
              <dt className="text-muted-foreground text-xs">E-mail</dt>
              <dd className="font-medium break-all">{user.email}</dd>
            </div>
            <div className="space-y-1">
              <dt className="text-muted-foreground text-xs">Gênero</dt>
              <dd className="font-medium">{generoLabel(user.genero)}</dd>
            </div>
            <div className="space-y-1">
              <dt className="text-muted-foreground text-xs">Telefone</dt>
              <dd className="font-medium">{user.phone || "-"}</dd>
            </div>
          </dl>

          <Separator className="my-4 sm:my-5" />

          {/* Modalidades */}
          <div>
            <div className="text-muted-foreground text-xs mb-2">Esportes</div>
            {sportDefs.length === 0 ? (
              <p className="text-sm">Nenhuma modalidade informada.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {sportDefs.map((s) => (
                  <Badge
                    key={s.id}
                    variant="secondary"
                    className="gap-1.5 px-2.5 py-1 text-xs sm:text-sm"
                  >
                    <s.Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-500" />
                    {s.label}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
