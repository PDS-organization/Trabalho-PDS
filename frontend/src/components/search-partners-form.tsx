"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form, FormControl, FormField, FormItem, FormMessage, FormLabel,
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
  Info,
  Search,
} from "lucide-react";

import { SPORTS, SPORT_IDS, type SportId } from "@/data/sports";

// -------------------------------------------------------------
// Helpers
// -------------------------------------------------------------
const cepRegex = /^\d{5}-?\d{3}$/;
const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

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

// -------------------------------------------------------------
// Schema (apenas CEP é obrigatório para o endpoint /proximas)
// -------------------------------------------------------------
const schema = z.object({
  sports: z.array(z.enum(SPORT_IDS)).optional().default([]),
  date: z.string().optional().default(""),
  time: z.string().regex(timeRegex, "Horário inválido").optional().or(z.literal("")),
  cep: z.string().regex(cepRegex, "CEP no formato 00000-000"),
});

type Values = z.infer<typeof schema>;

// -------------------------------------------------------------
// Componente
// -------------------------------------------------------------
export default function SearchPartnersForm({
  className,
  onSearch,
}: {
  className?: string;
  onSearch?: (v: Values) => Promise<void> | void;
}) {
  const router = useRouter();
  const qs = useSearchParams();

  const qsSports = (qs.getAll("sports").filter(Boolean) as SportId[]) || [];
  const initial: Partial<Values> = {
    sports: qsSports.length ? qsSports : [],
    cep: qs.get("cep") ?? "",
    date: qs.get("date") ?? "",
    time: qs.get("time") ?? "",
  };

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    mode: "onSubmit",
    defaultValues: {
      sports: initial.sports ?? [],
      cep: initial.cep ?? "",
      date: initial.date ?? "",
      time: initial.time ?? "",
    },
  });

  const [openCal, setOpenCal] = useState(false);
  const [openSports, setOpenSports] = useState(false);
  const [openTip, setOpenTip] = useState(false);
  const [loading, setLoading] = useState(false);

  const todayYMD = toYMD(new Date());
  const isFormValid = form.formState.isValid;

  const getMinTime = useCallback(() => {
    const currentDate = form.getValues("date");
    return currentDate === todayYMD ? nowHHMM() : "00:00";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayYMD]);

  async function submit(values: Values) {
    if (loading) return;

    // se o consumer quiser tratar por conta
    if (onSearch) {
      await onSearch(values);
      return;
    }

    setLoading(true);
    try {
      // monta exatamente o mesmo request do cURL
      const cep = values.cep.replace(/\D/g, "").replace(/^(\d{5})(\d{3})$/, "$1-$2");
      const params = new URLSearchParams();
      params.set("cep", cep);
      params.set("distanciaKm", "10"); // igual ao cURL
      params.set("page", "0");
      params.set("size", "10");

      // proxy no Next: /app/api/atividades/proximas/route.ts
      const url = `/api/atividades/proximas?${params.toString()}`;
      const res = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/json" },
        credentials: "include",
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        console.error("GET proximas falhou:", res.status, txt);
        alert("Não foi possível buscar as atividades próximas.");
        return;
      }

      const data = await res.json(); // { content, currentPage, totalElements, totalPages }
      // guarda em sessionStorage para a página de resultados
      try {
        sessionStorage.setItem("resultadosAtividades", JSON.stringify(data));
      } catch (e) {
        console.warn("Falha ao salvar no sessionStorage:", e);
      }

      // redireciona depois de salvar
      router.push("/app/resultados"); // query só pra evitar confusão de cache
    } catch (e: any) {
      console.error("Erro na busca de atividades:", e?.message || e);
      alert("Não foi possível buscar as atividades próximas.");
    } finally {
      setLoading(false);
    }
  }

  // helpers de UI (ícone à esquerda)
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

  const toggleSport = useCallback((id: SportId) => {
    const currentSports = form.getValues("sports") ?? [];
    const cur = new Set(currentSports);
    if (cur.has(id)) cur.delete(id);
    else cur.add(id);
    form.setValue("sports", Array.from(cur), { shouldValidate: false, shouldDirty: true });
  }, [form]);

  const selectedSports = (form.watch("sports") as SportId[]) ?? [];

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(submit)}
        className={["grid grid-cols-1 gap-3", className].filter(Boolean).join(" ")}
      >
        {/* Esportes (multi) — só UI */}
        <FormField
          control={form.control}
          name="sports"
          render={() => (
            <FormItem>
              <FormControl>
                <Popover open={openSports} onOpenChange={setOpenSports}>
                  <PopoverTrigger asChild>
                    <div>
                      <WithIcon icon={<Search className="h-5 w-5 text-muted-foreground" />}>
                        <Button
                          type="button"
                          variant="outline"
                          className="h-12 w-full justify-between text-base"
                          onClick={() => setOpenSports(true)}
                        >
                          {selectedSports.length
                            ? `${selectedSports.length} esporte${selectedSports.length > 1 ? "s" : ""} selecionado${selectedSports.length > 1 ? "s" : ""}`
                            : "Selecione os esportes"}
                          <ChevronDownIcon className="h-4 w-4 opacity-70" />
                        </Button>
                      </WithIcon>
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-[min(28rem,calc(100vw-2rem))] p-2">
                    <div className="max-h-64 overflow-y-auto pr-1">
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {SPORTS.map((s) => {
                          const checked = selectedSports.includes(s.id);
                          return (
                            <li key={s.id}>
                              <button
                                type="button"
                                onClick={() => toggleSport(s.id)}
                                className={[
                                  "w-full flex items-center gap-2 rounded-md border p-2 text-left",
                                  checked ? "border-amber-500 bg-amber-50" : "hover:bg-muted",
                                ].join(" ")}
                              >
                                <Checkbox
                                  checked={checked}
                                  onCheckedChange={() => toggleSport(s.id)}
                                  className="pointer-events-none"
                                />
                                <s.Icon className="h-4 w-4 shrink-0" />
                                <span className="text-sm">{s.label}</span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                    <div className="mt-2 flex justify-end">
                      <Button size="sm" onClick={() => setOpenSports(false)}>
                        OK
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* CEP (obrigatório) */}
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
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "").slice(0, 8);
                      const masked = digits.replace(/^(\d{5})(\d{0,3}).*/, (_, a, b) => (b ? `${a}-${b}` : a));
                      field.onChange(masked);
                    }}
                  />
                </WithIcon>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Dia (opcional — só UI) */}
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
                        >
                          {field.value ? formatBR(field.value) : "Selecione a data (opcional)"}
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

        {/* Hora (opcional — só UI) */}
        <FormField
          control={form.control}
          name="time"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium flex items-center gap-2 md:sr-only">
                Horário (opcional)
                <Popover open={openTip} onOpenChange={setOpenTip}>
                  <PopoverTrigger asChild>
                    <button type="button" className="inline-flex items-center md:hidden">
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent side="bottom" align="start" className="w-64 p-2 md:hidden">
                    Apenas informativo por enquanto. A busca por CEP ignora horário.
                  </PopoverContent>
                </Popover>
              </FormLabel>
              <FormControl>
                <WithIcon icon={<Clock className="h-5 w-5 text-muted-foreground" />}>
                  <Input
                    type="time"
                    step={60}
                    min={getMinTime()}
                    className="h-12 text-base"
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

        {/* Submit */}
        <div className="flex justify-end">
          <Button
            type="submit"
            className="h-12 px-6 text-base"
            disabled={!isFormValid || form.formState.isSubmitting || loading}
          >
            {loading ? "Buscando..." : "Buscar atividades"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
