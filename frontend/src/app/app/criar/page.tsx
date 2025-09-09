"use client";

import { useState, useCallback, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form, FormControl, FormField, FormItem, FormMessage,
} from "@/components/ui/form";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  MapPin,
  Calendar as CalIcon,
  Clock,
  ChevronDownIcon,
  Users,
  ListChecks,
  StickyNote,
  Type as TitleIcon,
  BadgePlus,
  Loader2,
} from "lucide-react";

import { SPORTS, SPORT_IDS, type SportId } from "@/data/sports";

// -------------------------------------------------------------
// Helpers & Consts
// -------------------------------------------------------------
const cepRegex = /^\d{5}-?\d{3}$/;
const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

const UFS = [
  "AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT",
  "PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO",
] as const;
type UF = typeof UFS[number];

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
function nowHHMM() {
  const n = new Date();
  return `${String(n.getHours()).padStart(2, "0")}:${String(n.getMinutes()).padStart(2, "0")}`;
}
function formatCEP(raw: string) {
  const digits = String(raw ?? "").replace(/\D/g, "").slice(0, 8);
  return digits.replace(/^(\d{5})(\d{0,3}).*/, (_, a, b) => (b ? `${a}-${b}` : a));
}
function timeToHHMMSS(t: string) {
  return /^\d{2}:\d{2}:\d{2}$/.test(t) ? t : `${t}:00`;
}

// ViaCEP (aceita string opcional sem erro de TS)
async function fetchViaCEP(cep?: string): Promise<{ logradouro: string; uf: UF } | null> {
  try {
    if (!cep) return null;
    const cleanCEP = cep.replace(/\D/g, "");
    if (cleanCEP.length !== 8) return null;

    const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
    if (!response.ok) return null;

    const data = await response.json();
    if (data.erro) return null;

    return {
      logradouro: data.logradouro || "",
      uf: data.uf as UF,
    };
  } catch {
    return null;
  }
}

// -------------------------------------------------------------
// Schema (mantemos 'status' local, mas ele não é enviado p/ backend)
// -------------------------------------------------------------
const schema = z.object({
  sport: z.custom<SportId>(
    (v): v is SportId =>
      typeof v === "string" && (SPORT_IDS as readonly string[]).includes(v),
    { message: "Selecione um esporte" }
  ),
  cep: z.string().regex(cepRegex, "CEP no formato 00000-000"),
  uf: z.enum(UFS),
  date: z.string().min(1, "Selecione a data"),
  time: z.string().regex(timeRegex, "Horário inválido"),
  street: z.string().trim().max(120, "Máximo 120 caracteres").optional().or(z.literal("")),
  title: z.string().trim().max(60, "Máximo 60 caracteres").optional().or(z.literal("")),
  notes: z.string().trim().max(300, "Máximo 300 caracteres").optional().or(z.literal("")),
  status: z.enum(["open","closed","canceled"] as const), // usado só na UI
  capacity: z.preprocess((v) => {
    if (v === null || v === undefined || v === "" || v === "null") return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : v;
  }, z.number().int().min(1, "Mínimo 1").max(500, "Máximo 500").nullable()),
}).refine((v) => {
  const today = toYMD(new Date());
  if (v.date === today) return v.time >= nowHHMM();
  return true;
}, { path: ["time"], message: "Use um horário no futuro" });

export type CreateActivityValues = z.infer<typeof schema>;

// -------------------------------------------------------------
// Component
// -------------------------------------------------------------
export default function CreateActivityForm({
  className,
  currentUserId,         // não usado no payload — mantido se quiser telemetria
  defaultUF = "SP",
  defaultCEP = "",
  defaultStreet = "",
  onCreate,
}: {
  className?: string;
  currentUserId: string;
  defaultUF?: UF;
  defaultCEP?: string;
  defaultStreet?: string;
  onCreate?: (rawDto: any) => Promise<void> | void;
}) {
  const router = useRouter();

  const form = useForm<CreateActivityValues>({
    resolver: zodResolver(schema) as any,
    mode: "onChange",
    defaultValues: {
      sport: undefined as unknown as SportId,
      cep: formatCEP(defaultCEP),
      uf: defaultUF,
      date: "",
      time: "",
      street: defaultStreet,
      title: "",
      notes: "",
      capacity: null,
      status: "open",
    },
  });

  const [openCal, setOpenCal] = useState(false);
  const [openSports, setOpenSports] = useState(false);
  const [isLoadingCEP, setIsLoadingCEP] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const todayYMD = toYMD(new Date());

  const getMinTime = useCallback(() => {
    const currentDate = form.getValues("date");
    return currentDate === todayYMD ? nowHHMM() : "00:00";
  }, [form, todayYMD]);

  const isFormValid = form.formState.isValid;

  // Debounce ViaCEP → preenche UF e Rua
  useEffect(() => {
    let cepTimer: ReturnType<typeof setTimeout> | null = null;

    const subscription = form.watch((value, { name }) => {
      if (name !== "cep") return;
      const cep = typeof value.cep === "string" ? value.cep : "";
      const cleanCEP = cep.replace(/\D/g, "");
      if (cleanCEP.length !== 8) return;

      if (cepTimer) clearTimeout(cepTimer);
      cepTimer = setTimeout(async () => {
        setIsLoadingCEP(true);
        try {
          const viaCepData = await fetchViaCEP(cep);
          if (viaCepData) {
            form.setValue("uf", viaCepData.uf, { shouldValidate: true });
            form.setValue("street", viaCepData.logradouro, { shouldValidate: true });
          }
        } catch (e) {
          console.error("Erro ao consultar ViaCEP:", e);
        } finally {
          setIsLoadingCEP(false);
        }
      }, 500);
    });

    return () => {
      if (cepTimer) clearTimeout(cepTimer);
      subscription.unsubscribe();
    };
  }, [form]);

  // UI helper
  function WithIcon({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
    return (
      <div className="relative">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          {icon}
        </div>
        <div className="[&>input]:pl-10 [&>button]:pl-10 [&>textarea]:pl-10">
          {children}
        </div>
      </div>
    );
  }

  const setSport = useCallback((id: SportId) => {
    form.setValue("sport", id, { shouldValidate: true, shouldDirty: true });
  }, [form]);

  const selectedSport = form.watch("sport") as SportId | undefined;
  const selectedUF = form.watch("uf") as UF;
  const capacityIsNoLimit = form.watch("capacity") === null;

  const toggleNoLimit = useCallback((checked: boolean | "indeterminate") => {
    const v = !!checked;
    form.setValue("capacity", v ? null : (1 as unknown as number), {
      shouldValidate: true,
      shouldDirty: true,
    });
  }, [form]);

  async function submit(values: CreateActivityValues) {
    try {
      setSubmitting(true);

      // monta o payload esperado pela **/api/atividades** (nossa route interna)
      const dtoForApi = {
        sport: values.sport,                              // ex.: "BASQUETE"
        date: values.date,                                // "YYYY-MM-DD"
        time: timeToHHMMSS(values.time).slice(0,5),       // envia "HH:mm" (a route completa p/ HH:mm:ss)
        cep: values.cep.replace(/\D/g, "").replace(/^(\d{5})(\d{3})$/, "$1-$2"),
        uf: values.uf,
        street: (values.street ?? "").trim(),
        title: (values.title ?? "").trim(),
        notes: (values.notes ?? "").trim(),
        capacity: values.capacity,                        // null = sem limite (a route envia 0)
      };

      if (onCreate) await onCreate(dtoForApi);

      const res = await fetch("/api/atividades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(dtoForApi),
      });

      if (res.status === 201) {
        // nossa API responde 201 sem body; pega Location do header
        const loc = res.headers.get("Location");
        if (loc) {
          const m = loc.match(/\/atividades\/([0-9a-fA-F-]+)/);
          if (m) {
            router.push(`/app/atividades/${m[1]}`);
          } else {
            router.push("/app");
          }
        } else {
          router.push("/app");
        }

        form.reset({
          sport: undefined as unknown as SportId,
          cep: formatCEP(""),
          uf: "SP",
          date: "",
          time: "",
          street: "",
          title: "",
          notes: "",
          capacity: null,
          status: "open",
        });
        return;
      }

      // erros
      let errText = "";
      try { errText = await res.text(); } catch {}
      let err: any = null;
      try { err = errText ? JSON.parse(errText) : null; } catch {}

      if (res.status === 400) {
        console.error("Validação backend:", err || errText);
        alert(err?.message ?? "Dados inválidos. Verifique os campos.");
        return;
      }
      if (res.status === 401) {
        alert("Sessão expirada. Faça login novamente.");
        return;
      }

      console.error("Erro upstream:", res.status, err || errText);
      alert(`Erro ao criar atividade (backend ${res.status}).`);
    } catch (e: any) {
      console.error(e);
      alert(e?.message ?? "Falha ao criar atividade.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(submit)}
        className={["grid grid-cols-1 gap-3", className].filter(Boolean).join(" ")}
      >
        {/* SPORT */}
        <FormField
          control={form.control}
          name="sport"
          render={() => (
            <FormItem>
              <FormControl>
                <Popover open={openSports} onOpenChange={setOpenSports}>
                  <PopoverTrigger asChild>
                    <div>
                      <WithIcon icon={<BadgePlus className="h-5 w-5 text-muted-foreground" />}>
                        <Button
                          type="button"
                          variant="outline"
                          className="h-12 w-full justify-between text-base"
                          onClick={() => setOpenSports(true)}
                        >
                          {selectedSport
                            ? (() => {
                                const s = SPORTS.find((x) => x.id === selectedSport)!;
                                return (
                                  <span className="inline-flex items-center gap-2">
                                    <s.Icon className="h-4 w-4" />
                                    {s.label}
                                  </span>
                                );
                              })()
                            : "Selecione o esporte"}
                          <ChevronDownIcon className="h-4 w-4 opacity-70" />
                        </Button>
                      </WithIcon>
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-[min(28rem,calc(100vw-2rem))] p-2">
                    <div className="max-h-64 overflow-y-auto pr-1">
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {SPORTS.map((s) => {
                          const checked = selectedSport === s.id;
                          return (
                            <li key={s.id}>
                              <button
                                type="button"
                                onClick={() => {
                                  setSport(s.id);
                                  setOpenSports(false);
                                }}
                                className={[
                                  "w-full flex items-center gap-2 rounded-md border p-2 text-left",
                                  checked ? "border-amber-500 bg-amber-50" : "hover:bg-muted",
                                ].join(" ")}
                              >
                                <div
                                  className={[
                                    "h-4 w-4 rounded-full border flex items-center justify-center",
                                    checked ? "border-amber-500" : "border-muted-foreground/40",
                                  ].join(" ")}
                                >
                                  {checked ? <div className="h-2 w-2 rounded-full" /> : null}
                                </div>
                                <s.Icon className="h-4 w-4 shrink-0" />
                                <span className="text-sm">{s.label}</span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </PopoverContent>
                </Popover>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* CEP */}
        <FormField
          control={form.control}
          name="cep"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <WithIcon icon={<MapPin className="h-5 w-5 text-muted-foreground" />}>
                  <Input
                    inputMode="numeric"
                    placeholder="CEP (00000-000)"
                    className="h-12 text-base"
                    {...field}
                    onChange={(e) => field.onChange(formatCEP(e.target.value))}
                  />
                  {isLoadingCEP && (
                    <div className="absolute inset-y-0 right-3 flex items-center">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  )}
                </WithIcon>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* UF (somente leitura) */}
        <FormField
          control={form.control}
          name="uf"
          render={() => (
            <FormItem>
              <FormControl>
                <WithIcon icon={<MapPin className="h-5 w-5 text-muted-foreground" />}>
                  <Input
                    placeholder="Estado (UF)"
                    className="h-12 text-base bg-muted"
                    disabled
                    value={selectedUF ? `UF: ${selectedUF}` : ""}
                    readOnly
                  />
                </WithIcon>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Rua (preenchido via CEP) */}
        <FormField
          control={form.control}
          name="street"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <WithIcon icon={<ListChecks className="h-5 w-5 text-muted-foreground" />}>
                  <Input
                    placeholder="Rua / complemento (automático via CEP)"
                    className="h-12 text-base bg-muted"
                    disabled
                    {...field}
                  />
                </WithIcon>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Data */}
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Popover open={openCal} onOpenChange={setOpenCal}>
                  <PopoverTrigger asChild>
                    <div>
                      <WithIcon icon={<CalIcon className="h-5 w-5 text-muted-foreground" />}>
                        <Button
                          type="button"
                          variant="outline"
                          className="h-12 w-full justify-between text-base"
                          onClick={() => setOpenCal(true)}
                        >
                          {field.value ? formatBR(field.value) : "Selecione a data"}
                          <ChevronDownIcon className="h-4 w-4 opacity-70" />
                        </Button>
                      </WithIcon>
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={parseYMD(field.value)}
                      captionLayout="dropdown"
                      fromDate={new Date()}
                      disabled={{ before: new Date() }}
                      onSelect={(d) => {
                        if (d) {
                          field.onChange(toYMD(d));
                          setOpenCal(false);
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

        {/* Hora */}
        <FormField
          control={form.control}
          name="time"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <WithIcon icon={<Clock className="h-5 w-5 text-muted-foreground" />}>
                  <Input
                    type="time"
                    step={60}
                    min={getMinTime()}
                    className="h-12 text-base no-time-picker"
                    onClick={(e) => (e.currentTarget as HTMLInputElement).showPicker?.()}
                    onFocus={(e) => (e.currentTarget as HTMLInputElement).showPicker?.()}
                    {...field}
                  />
                </WithIcon>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Título (opcional) */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <WithIcon icon={<TitleIcon className="h-5 w-5 text-muted-foreground" />}>
                  <Input
                    placeholder="Título da atividade (opcional)"
                    className="h-12 text-base"
                    {...field}
                  />
                </WithIcon>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Observações (opcional) */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <WithIcon icon={<StickyNote className="h-5 w-5 text-muted-foreground" />}>
                  <Textarea
                    placeholder="Observações (ex.: 'Trazer colete')"
                    className="min-h-[100px] text-base"
                    {...field}
                  />
                </WithIcon>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Capacidade + Sem limite */}
        <div className="grid grid-cols-[1fr_auto] gap-2 items-center">
          <FormField
            control={form.control}
            name="capacity"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <WithIcon icon={<Users className="h-5 w-5 text-muted-foreground" />}>
                    <Input
                      type="number"
                      min={1}
                      placeholder="Capacidade (opcional)"
                      className="h-12 text-base"
                      disabled={capacityIsNoLimit}
                      value={capacityIsNoLimit ? "" : (field.value ?? "")}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === "") field.onChange(null);
                        else {
                          const n = Number(v);
                          field.onChange(Number.isFinite(n) ? n : v);
                        }
                      }}
                    />
                  </WithIcon>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex items-center gap-2">
            <Checkbox
              checked={capacityIsNoLimit}
              onCheckedChange={toggleNoLimit}
              id="no-limit"
            />
            <label htmlFor="no-limit" className="text-sm leading-none cursor-pointer">
              Sem limite
            </label>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <Button
            type="submit"
            className="h-12 px-6 text-base"
            disabled={!isFormValid || form.formState.isSubmitting || submitting}
          >
            {submitting ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Criando…
              </span>
            ) : (
              "Criar atividade"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
