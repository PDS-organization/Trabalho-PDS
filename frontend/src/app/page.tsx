import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center p-10">
      <div className="max-w-md w-full space-y-4 text-center">
        <h1 className="text-3xl font-bold">SimBora</h1>
        <p className="text-muted-foreground">Aplicativo para encontrar parceiros de treino próximos de você</p>
        <div className="flex items-center justify-center gap-3">
          <Button>Cadastrar</Button>
          <Button variant="secondary">Login</Button>
          {/* <Button variant="outline">Outline</Button> */}
        </div>
      </div>
    </main>
  );
}
