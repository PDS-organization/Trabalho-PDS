"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MapPin,
  Dumbbell,
  CalendarDays,
  Search,
  Users2,
  ShieldCheck,
  Rocket,
} from "lucide-react";
import SearchPartnersForm from "@/components/search-partners-form";
import Navbar from "@/components/layout/navbar";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* NAVBAR (opcional simples) */}
      <Navbar />

      {/* HERO – full-bleed image with centered headline and overlapping search card */}
      <section className="relative">
        {/* Background illustration (replace /hero-simbora.svg with your asset) */}
        <div
          className="h-[48vh] w-full bg-[url('/simbora.png')] bg-cover bg-center lg:h-[56vh]"
          aria-hidden
        />

        {/* Headline centered over the image */}
        <div className="absolute inset-0 flex items-start justify-center pt-12 lg:pt-16 ">
          <div className="px-4 text-center pointer-events-auto select-text ">
            <h1 className="text-4xl font-extrabold tracking-tight drop-shadow md:text-5xl">
              Encontre treinos perto de você
            </h1>
          </div>
        </div>


        <div className="absolute left-1/2 top-full z-20 w-full -translate-x-1/2 -translate-y-1/3 px-4 sm:-translate-y-1/2">
          <Card className="mx-auto max-w-5xl shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold">Procure um parceiro</CardTitle>
            </CardHeader>

            <CardContent className="pb-4">
              <SearchPartnersForm
                className="sm:grid-cols-2 lg:grid-cols-[1fr_0.6fr_0.5fr_0.2fr_auto] gap-3 items-end"
              />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* EXPLICAÇÃO RÁPIDA – 3 passos */}
      <section id="como-funciona" className="container mx-auto px-4 pb-24 pt-88 sm:pt-40">
        <div className="mx-auto mb-8 max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight">Como funciona</h2>
          <p className="mt-2 text-muted-foreground">
            Em poucos passos você encontra alguém para treinar com você.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Passo 1 */}
          <Card className="border-muted-foreground/20">
            <CardHeader>
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Dumbbell className="h-5 w-5 text-primary" />
              </div>
              <CardTitle>1. Cadastre-se</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              Crie seu perfil esportivo, escolha seus esportes favoritos e defina seus horários.
            </CardContent>
          </Card>

          {/* Passo 2 */}
          <Card className="border-muted-foreground/20">
            <CardHeader>
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <CardTitle>2. Encontre parceiros</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              Busque pessoas perto de você com interesses e níveis semelhantes para treinar juntos.
            </CardContent>
          </Card>

          {/* Passo 3 */}
          <Card className="border-muted-foreground/20">
            <CardHeader>
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Users2 className="h-5 w-5 text-primary" />
              </div>
              <CardTitle>3. Treine junto</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              Combine o local, horário e atividade — mantenha a motivação em dupla e alcance suas metas.
            </CardContent>
          </Card>
        </div>
      </section>

      {/* RODAPÉ simples */}
      <footer className="border-t py-10">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 text-sm text-muted-foreground md:flex-row">
          <p>© {new Date().getFullYear()} SimBora. Todos os direitos reservados.</p>
          <div className="flex items-center gap-4">
            <Link href="/privacidade" className="hover:underline">
              Privacidade
            </Link>
            <Link href="/contato" className="hover:underline">
              Contato
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
