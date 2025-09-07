"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuViewport,
} from "@/components/ui/navigation-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Search, PlusCircle } from "lucide-react";
import BrandLogo from "@/components/brand/logo";

function Logo({ className = "h-6 w-auto" }: { className?: string }) {
  return <BrandLogo className={className} />;
}

function useMe() {
  const [me, setMe] = useState<{ name?: string; email?: string; avatarUrl?: string; username?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetch("/api/fake/me")
      .then(async (r) => {
        if (!mounted) return;
        if (!r.ok) return setMe(null);
        const j = await r.json();
        setMe(j.user ?? null);
      })
      .catch(() => {
        if (mounted) setMe(null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  return { user: me, loading };
}

export default function Navbar() {
  const pathname = usePathname();
  const { user: me, loading } = useMe();
  const profileHref = me?.username ? `/app/u/${me.username}` : "/app";

  const isActive = (href: string) => pathname?.startsWith(href);

  // Loading state
  if (loading) {
    return (
      <header className="fixed inset-x-0 top-0 z-[100] border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="app-container">
          <div className="flex h-14 items-center">
            <Link href="/" className="inline-flex items-center gap-2">
              <Logo />
            </Link>
          </div>
        </div>
      </header>
    );
  }

  // Navbar para usuário DESLOGADO
  if (!me) {
    return (
      <header className="fixed inset-x-0 top-0 z-[100] border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="app-container">
          <div className="flex h-14 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="inline-flex items-center gap-2">
              <Logo />
            </Link>

            {/* Botões de autenticação */}
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">
                  Entrar
                </Link>
              </Button>
              <Button variant="default" size="sm" asChild>
                <Link href="/cadastro">
                  Cadastrar-se
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="fixed inset-x-0 top-0 z-[100] border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 overflow-x-clip">
      <div className="app-container">
        <div className="flex h-14 items-center">
          <div className="flex min-w-0 flex-1">
            <Link href="/app" className="inline-flex items-center gap-2">
              <Logo />
            </Link>
          </div>

          <nav className="hidden sm:flex flex-1 justify-center">
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuViewport
                  className="absolute left-1/2 top-full z-50
               w-[var(--radix-navigation-menu-viewport-width)]
               -translate-x-1/2 overflow-hidden rounded-md border
               bg-popover text-popover-foreground shadow-md
               data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95
               data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=closed]:fade-out-0"
                />
                <NavigationMenuItem>
                  <NavigationMenuLink asChild active={isActive("/app/buscar")}>
                    <Link
                      href="/app/buscar"
                      className={`px-3 py-2 rounded-md text-sm transition-colors ${isActive("/app/buscar")
                        ? "bg-amber-100 text-amber-900"
                        : "hover:bg-muted"
                        }`}
                    >
                      Buscar parceiros
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuLink asChild active={isActive("/app/criar")}>
                    <Link
                      href="/app/criar"
                      className={`px-3 py-2 rounded-md text-sm transition-colors ${isActive("/app/criar")
                        ? "bg-amber-100 text-amber-900"
                        : "hover:bg-muted"
                        }`}
                    >
                      Criar atividade
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </nav>

          <nav className="sm:hidden flex items-center gap-2">
            <Link href="/app/buscar" aria-label="Buscar parceiros"
              className={`p-2 rounded-md transition-colors ${isActive("/app/buscar") ? "bg-amber-100 text-amber-900" : "hover:bg-muted"}`}>
              <Search className="h-5 w-5" />
            </Link>
            <Link href="/app/criar" aria-label="Criar atividade"
              className={`p-2 rounded-md transition-colors ${isActive("/app/criar") ? "bg-amber-100 text-amber-900" : "hover:bg-muted"}`}>
              <PlusCircle className="h-5 w-5" />
            </Link>
          </nav>

          <div className="flex min-w-0 flex-1 justify-end">
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger
                    className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 hover:bg-muted group"
                    title="Conta"
                  >
                    <Link
                      href={profileHref}
                      className="inline-flex"
                      onClick={(e) => e.stopPropagation()} // evita toggling do menu
                    >
                      <Avatar className="h-8 w-8 ring-1 ring-border">
                        <AvatarImage src={me?.avatarUrl} alt={me?.name ?? "Perfil"} />
                        <AvatarFallback>
                          {(me?.name ?? me?.email ?? "U").slice(0, 1).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Link>
                  </NavigationMenuTrigger>

                  <NavigationMenuContent className="p-2 w-max min-w-[4rem] max-w-[calc(100vw-1rem)]">
                    <ul className="flex flex-col gap-1">
                      <li>
                        <Link
                          href={profileHref}
                          className="block rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                        >
                          Perfil
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/app/minhas-atividades"
                          className="block rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                        >
                          Minhas atividades
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/app/matches"
                          className="block rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                        >
                          Matches pendentes
                        </Link>
                      </li>
                      <li className="border-t pt-1 mt-1">
                        <form action="/api/fake/logout" method="POST">
                          <button
                            type="submit"
                            className="w-full text-left cursor-pointer rounded-md px-2 py-1.5 text-sm hover:bg-muted text-muted-foreground"
                          >
                            Sair
                          </button>
                        </form>
                      </li>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>

        </div>
      </div>
    </header>
  );
}