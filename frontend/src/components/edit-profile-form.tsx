"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form, FormControl, FormField, FormItem, FormMessage,
} from "@/components/ui/form";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

import {
  User as UserIcon,
  AtSign,
  Calendar as CalIcon,
  Phone,
  Lock,
  ChevronDownIcon,
  Trophy,
  Loader2,
} from "lucide-react";

import { SPORTS } from "@/data/sports";

// ----------------------- helpers -----------------------
function toYMD(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function parseYMD(s?: string) {
  if (!s) return undefined;
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d);
}

function formatBR(s?: string) {
  if (!s) return "";
  const [y, m, d] = s.split("-");
  return `${d}/${m}/${y}`;
}

// ----------------------- componentes auxiliares -----------------------
// Movidos para fora do componente principal para evitar recriação
const WithIcon = ({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) => (
  <div className="relative">
    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
      {icon}
    </div>
    <div className="[&>input]:pl-10 [&>button]:pl-10 [&>textarea]:pl-10">
      {children}
    </div>
  </div>
);

const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="text-sm font-medium leading-none mb-1">{children}</div>
);

// ----------------------- schema -----------------------
const schema = z.object({
  name: z.string().trim().min(2, "Mínimo 2").max(100, "Máximo 100").optional().or(z.literal("")),
  username: z.string().trim().min(2, "Mínimo 2").max(50, "Máximo 50").optional().or(z.literal("")),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  dataNascimento: z.string().optional().or(z.literal("")),
  password: z.string().min(8, "Mínimo 8").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  modalidadesNomes: z.array(z.string()).optional(),
}).refine((v) => {
  if (!v.dataNascimento) return true;
  const d = parseYMD(v.dataNascimento);
  return d ? d <= new Date() : true;
}, { path: ["dataNascimento"], message: "Data não pode ser futura" });

type Values = z.infer<typeof schema>;

type Me = {
  id: string;
  email: string;
  username: string;
  name?: string;
  phone?: string;
  dataNascimento?: string; // YYYY-MM-DD
  modalidades?: string[];  // nomes (ex: "BASQUETE")
};

type Modalidade = { id: number; nome: string };

// ----------------------- component -----------------------
export default function EditProfileForm({ me }: { me: Me }) {
  const router = useRouter();
  const [mods, setMods] = useState<Modalidade[]>([]);
  const [loadingMods, setLoadingMods] = useState(true);
  const [saving, setSaving] = useState(false);
  const [openDOB, setOpenDOB] = useState(false);
  const [openSports, setOpenSports] = useState(false);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      name: me.name ?? "",
      username: me.username ?? "",
      email: me.email ?? "",
      dataNascimento: (me.dataNascimento ?? "").slice(0, 10),
      password: "",
      phone: me.phone ?? "",
      modalidadesNomes: me.modalidades ?? [],
    },
  });

  // carrega modalidades do backend
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const r = await fetch("/api/modalidades", { cache: "no-store" });
        if (!mounted) return;
        if (!r.ok) throw new Error(String(r.status));
        const j = await r.json();
        setMods(Array.isArray(j?.data) ? j.data : []);
      } catch {
        setMods([]);
      } finally {
        if (mounted) setLoadingMods(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const selectedSports = form.watch("modalidadesNomes") || [];
  const isValid = form.formState.isValid;

  const sportsToShow = useMemo(() => {
    if (!mods.length) return SPORTS;
    const nomes = new Set(mods.map((m) => m.nome));
    return SPORTS.filter((s) => nomes.has(s.id));
  }, [mods]);

  const toggleSport = useCallback((nome: string) => {
    const current = form.getValues("modalidadesNomes") || [];
    const set = new Set(current);
    if (set.has(nome)) {
      set.delete(nome);
    } else {
      set.add(nome);
    }
    form.setValue("modalidadesNomes", Array.from(set), { 
      shouldDirty: true, 
      shouldValidate: true 
    });
  }, [form]);

  const selectedCount = selectedSports.length;
  const selectedBadges = selectedSports.slice(0, 3);

  const onSubmit = useCallback(async (values: Values) => {
    try {
      setSaving(true);

      const payload: Record<string, any> = {};
      const pick = (k: keyof Values) => {
        const v = values[k];
        if (v === undefined) return;
        if (typeof v === "string" && v.trim() === "") return;
        payload[k] = v;
      };
      
      (["name","username","email","password","phone","dataNascimento"] as (keyof Values)[])
        .forEach(pick);
      
      if (values.modalidadesNomes) {
        payload.modalidadesNomes = values.modalidadesNomes;
      }

      const res = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json().catch(() => null);
        const username = data?.username ?? values.username ?? me.username;
        // router.push(`/app/u/${username}`);
        router.push(`/app/`);
        router.refresh();
        return;
      }

      const txt = await res.text().catch(() => "");
      let err: any = null;
      try { 
        err = txt ? JSON.parse(txt) : null; 
      } catch { 
        err = { raw: txt }; 
      }
      console.error("Erro update:", res.status, err);
      alert(err?.message ?? `Falha ao salvar (status ${res.status}).`);
    } catch (e: any) {
      console.error(e);
      alert(e?.message ?? "Erro inesperado.");
    } finally {
      setSaving(false);
    }
  }, [me.username, router]);

  const today = useMemo(() => new Date(), []);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 gap-3">
        {/* NAME */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FieldLabel>Nome</FieldLabel>
              <FormControl>
                <WithIcon icon={<UserIcon className="h-5 w-5 text-muted-foreground" />}>
                  <Input 
                    placeholder="Seu nome" 
                    className="h-12 text-base" 
                    {...field} 
                  />
                </WithIcon>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* USERNAME */}
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FieldLabel>Username</FieldLabel>
              <FormControl>
                <WithIcon icon={<AtSign className="h-5 w-5 text-muted-foreground" />}>
                  <Input 
                    placeholder="ex.: joaosilva" 
                    className="h-12 text-base" 
                    {...field} 
                  />
                </WithIcon>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* EMAIL */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FieldLabel>Email</FieldLabel>
              <FormControl>
                <WithIcon icon={<AtSign className="h-5 w-5 text-muted-foreground" />}>
                  <Input 
                    type="email" 
                    placeholder="ex.: voce@email.com" 
                    className="h-12 text-base" 
                    {...field} 
                  />
                </WithIcon>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* DATA DE NASCIMENTO */}
        <FormField
          control={form.control}
          name="dataNascimento"
          render={({ field }) => (
            <FormItem>
              <FieldLabel>Data de nascimento</FieldLabel>
              <FormControl>
                <Popover open={openDOB} onOpenChange={setOpenDOB}>
                  <PopoverTrigger asChild>
                    <div>
                      <WithIcon icon={<CalIcon className="h-5 w-5 text-muted-foreground" />}>
                        <Button
                          type="button"
                          variant="outline"
                          className="h-12 w-full justify-between text-base"
                          onClick={() => setOpenDOB(true)}
                        >
                          <span>{field.value ? formatBR(field.value) : "Selecione a data"}</span>
                          <ChevronDownIcon className="h-4 w-4 opacity-70 shrink-0" />
                        </Button>
                      </WithIcon>
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={parseYMD(field.value)}
                      captionLayout="dropdown"
                      toDate={today}
                      disabled={{ after: today }}
                      onSelect={(d) => {
                        if (d) {
                          field.onChange(toYMD(d));
                          setOpenDOB(false);
                        }
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* PASSWORD */}
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FieldLabel>Nova senha (opcional)</FieldLabel>
              <FormControl>
                <WithIcon icon={<Lock className="h-5 w-5 text-muted-foreground" />}>
                  <Input 
                    type="password" 
                    placeholder="••••••••" 
                    className="h-12 text-base" 
                    {...field} 
                  />
                </WithIcon>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* PHONE */}
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FieldLabel>Telefone</FieldLabel>
              <FormControl>
                <WithIcon icon={<Phone className="h-5 w-5 text-muted-foreground" />}>
                  <Input 
                    type="tel"
                    placeholder="(11) 99999-9999" 
                    className="h-12 text-base"
                    inputMode="tel"
                    {...field} 
                  />
                </WithIcon>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* MODALIDADES */}
        <FormField
          control={form.control}
          name="modalidadesNomes"
          render={() => (
            <FormItem>
              <FieldLabel>Modalidades</FieldLabel>
              <FormControl>
                <Popover open={openSports} onOpenChange={setOpenSports}>
                  <PopoverTrigger asChild>
                    <div>
                      <WithIcon icon={<Trophy className="h-5 w-5 text-muted-foreground" />}>
                        <Button
                          type="button"
                          variant="outline"
                          className="h-12 w-full justify-between text-base"
                          onClick={() => setOpenSports(true)}
                        >
                          <span className="inline-flex items-center gap-2 flex-1 truncate">
                            {selectedCount > 0 ? (
                              <>
                                {selectedBadges.map((nome) => {
                                  const s = SPORTS.find((x) => x.id === nome);
                                  return s ? (
                                    <span 
                                      key={s.id} 
                                      className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs"
                                    >
                                      <s.Icon className="h-3.5 w-3.5" />
                                      {s.label}
                                    </span>
                                  ) : (
                                    <span 
                                      key={nome} 
                                      className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs"
                                    >
                                      {nome}
                                    </span>
                                  );
                                })}
                                {selectedCount > 3 && (
                                  <span className="text-xs text-muted-foreground">
                                    +{selectedCount - 3}
                                  </span>
                                )}
                              </>
                            ) : (
                              "Selecione suas modalidades"
                            )}
                          </span>
                          <ChevronDownIcon className="h-4 w-4 opacity-70 shrink-0" />
                        </Button>
                      </WithIcon>
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-[min(28rem,calc(100vw-2rem))] p-2">
                    {loadingMods ? (
                      <div className="text-sm text-muted-foreground inline-flex items-center gap-2 px-1 py-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Carregando modalidades…</span>
                      </div>
                    ) : (
                      <div className="max-h-64 overflow-y-auto pr-1">
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {sportsToShow.map((s) => {
                            const checked = selectedSports.includes(s.id);
                            return (
                              <li key={s.id}>
                                <button
                                  type="button"
                                  onClick={() => toggleSport(s.id)}
                                  className={`
                                    w-full flex items-center gap-2 rounded-md border p-2 text-left transition-colors
                                    ${checked 
                                      ? "border-amber-500 bg-amber-50" 
                                      : "hover:bg-muted"
                                    }
                                  `}
                                >
                                  <div
                                    className={`
                                      h-4 w-4 rounded-[4px] border flex items-center justify-center transition-colors
                                      ${checked 
                                        ? "border-amber-500 bg-amber-500" 
                                        : "border-muted-foreground/40"
                                      }
                                    `}
                                  >
                                    {checked && (
                                      <div className="h-2 w-2 rounded-[2px] bg-white" />
                                    )}
                                  </div>
                                  <s.Icon className="h-4 w-4 shrink-0" />
                                  <span className="text-sm">{s.label}</span>
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button 
            type="submit" 
            className="h-12 px-6 text-base" 
            disabled={!isValid || form.formState.isSubmitting || saving}
          >
            {saving ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Salvando…</span>
              </span>
            ) : (
              "Salvar alterações"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}