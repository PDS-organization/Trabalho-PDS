import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySession } from "@/lib/jwt";
import path from "node:path";
import fs from "node:fs/promises";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SPORTS, type SportId } from "@/data/sports";

export const runtime = "nodejs"; // vamos ler arquivo com fs

type UserRecord = {
  id: string;
  name: string;
  email: string;
  birthdate?: string; // "YYYY-MM-DD"
  gender?: "masculino" | "feminino" | "nao_informar" | "outro";
  cep?: string;
  uf?: string;
  street?: string;
  sports?: string[];
  avatarUrl?: string;
};

const FILE_PATH = path.join(process.cwd(), "data", "fake_users.jsonl");

async function findById(id: string): Promise<UserRecord | null> {
  try {
    const buf = await fs.readFile(FILE_PATH, "utf8");
    const lines = buf.trim().split("\n").filter(Boolean);
    for (let i = lines.length - 1; i >= 0; i--) {
      const u = JSON.parse(lines[i]) as UserRecord;
      if (u.id === id) return u;
    }
  } catch {}
  return null;
}

function formatDateBR(ymd?: string) {
  if (!ymd) return "-";
  const [y, m, d] = ymd.split("-");
  if (!y || !m || !d) return "-";
  return `${d}/${m}/${y}`;
}

const GENDER_LABEL: Record<NonNullable<UserRecord["gender"]>, string> = {
  masculino: "Masculino",
  feminino: "Feminino",
  outro: "Outro",
  nao_informar: "Prefiro não informar",
};

export default async function PerfilPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("sb:session")?.value ?? null;
  const session = await verifySession<{ sub: string }>(token);
  if (!session) redirect("/login?next=/app/perfil");

  const user = await findById(session.sub);
  if (!user) redirect("/login?next=/app/perfil");

  // mapeia esportes (usa fonte de verdade do /data/sports.ts)
  const sportDefs = (user.sports ?? [])
    .map((id) => {
      const def = SPORTS.find((s) => s.id === (id as SportId));
      return def ?? null;
    })
    .filter(Boolean) as typeof SPORTS;

  return (
    <main className="min-h-screen pt-4 sm:pt-6">
      {/* Cabeçalho */}
      <div className="flex items-center gap-3">
        <Avatar className="h-12 w-12 ring-1 ring-border">
          <AvatarImage src={user.avatarUrl} alt={user.name} />
          <AvatarFallback>{(user.name ?? user.email ?? "U").slice(0, 1).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <h1 className="text-lg font-semibold truncate">{user.name}</h1>
          <p className="text-sm text-muted-foreground truncate">{user.email}</p>
        </div>
      </div>

      {/* Infos */}
      <Card className="mt-4">
        <CardContent className="p-4">
          <dl className="grid grid-cols-1 gap-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Data de nascimento</dt>
              <dd className="font-medium">{formatDateBR(user.birthdate)}</dd>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div>
                <dt className="text-muted-foreground">Gênero</dt>
                <dd className="font-medium">{user.gender ? GENDER_LABEL[user.gender] : "-"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">CEP</dt>
                <dd className="font-medium">{user.cep || "-"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">UF</dt>
                <dd className="font-medium">{user.uf || "-"}</dd>
              </div>
            </div>
            <div>
              <dt className="text-muted-foreground">Rua</dt>
              <dd className="font-medium">{user.street || "-"}</dd>
            </div>
          </dl>

          {/* Esportes */}
          <div className="mt-4">
            <div className="text-muted-foreground text-sm mb-2">Esportes</div>
            {sportDefs.length === 0 ? (
              <p className="text-sm">Nenhum esporte selecionado.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {sportDefs.map((s) => (
                  <Badge key={s.id} variant="secondary" className="gap-1.5">
                    <s.Icon className="h-3.5 w-3.5 text-amber-500" />
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
