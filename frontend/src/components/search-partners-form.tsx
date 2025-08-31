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
import { Search, MapPin, Calendar as CalIcon, Clock, ChevronDownIcon, Info } from "lucide-react";
import { SPORTS, SPORT_IDS, type SportId } from "@/data/sports";

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

const schema = z.object({
  sports: z.array(z.enum(SPORT_IDS)).min(1, "Selecione pelo menos um esporte"),
  cep: z.string().regex(cepRegex, "CEP no formato 00000-000"),
  date: z.string().min(1, "Selecione o dia"),
  time: z.string().regex(timeRegex, "Horário inválido"),
}).refine((v) => {
  const today = toYMD(new Date());
  if (v.date === today) {
    return v.time >= nowHHMM();
  }
  return true;
}, { path: ["time"], message: "Use um horário no futuro" });

type Values = z.infer<typeof schema>;

export default function SearchPartnersForm({
  className,
  onSearch,
}: {
  className?: string;
  onSearch?: (v: Values) => Promise<void> | void;
}) {
  const router = useRouter();
  const qs = useSearchParams();

  // Pré-carrega do querystring (suporta múltiplos sports=?)
  const qsSports = qs.getAll("sports").filter(Boolean) as SportId[];
  const initial: Partial<Values> = {
    sports: qsSports.length ? qsSports : undefined,
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

  const todayYMD = toYMD(new Date());

  const getMinTime = useCallback(() => {
    const currentDate = form.getValues("date");
    return currentDate === todayYMD ? nowHHMM() : "00:00";
  }, [todayYMD]);

  const isFormValid = form.formState.isValid;

  async function submit(values: Values) {
    if (onSearch) {
      await onSearch(values);
      return;
    }
    const params = new URLSearchParams();
    values.sports.forEach((id) => params.append("sports", id));
    params.set("cep", values.cep.replace(/\D/g, "").replace(/^(\d{5})(\d{3})$/, "$1-$2"));
    params.set("date", values.date);
    params.set("time", values.time);
    router.push(`/app/buscar?${params.toString()}`);
  }

  // helpers de UI (ícone à esquerda)
  function WithIcon({
    icon, children,
  }: { icon: React.ReactNode; children: React.ReactNode }) {
    return (
      <div className="relative">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          {icon}
        </div>
        <div className="[&>input]:pl-10 [&>button]:pl-10">
          {children}
        </div>
      </div>
    );
  }

  const toggleSport = useCallback((id: SportId) => {
    const currentSports = form.getValues("sports");
    const cur = new Set(currentSports);
    if (cur.has(id)) cur.delete(id);
    else cur.add(id);
    form.setValue("sports", Array.from(cur), { shouldValidate: true, shouldDirty: true });
  }, [form]);

  const selectedSports = form.watch("sports") as SportId[];

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(submit)}
        className={["grid grid-cols-1 gap-3", className].filter(Boolean).join(" ")}
      >
        {/* Esportes (multi) */}
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

        {/* Dia */}
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
                          const ymd = toYMD(d);
                          field.onChange(ymd);
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

        {/* Horário - ATUALIZADO com explicação do range */}
        <FormField
          control={form.control}
          name="time"
          render={({ field }) => (
            <FormItem>
              {/* Label visível só no mobile; no desktop fica sr-only para reduzir altura */}
              <FormLabel className="text-sm font-medium flex items-center gap-2 md:sr-only">
                Horário de início
                {/* Tooltip só no mobile (desktop não mostra) */}
                <Popover open={openTip} onOpenChange={setOpenTip}>
                  <PopoverTrigger asChild>
                    <button type="button" className="inline-flex items-center md:hidden">
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent side="bottom" align="start" className="w-64 p-2 md:hidden">
                    Buscaremos atividades <strong>a partir</strong> deste horário.
                    Ex: se escolher 18:00, verá atividades às 18:00, 18:30, 19:00, etc.
                  </PopoverContent>
                </Popover>
              </FormLabel>

              <FormControl>
                <WithIcon icon={<Clock className="h-5 w-5 text-muted-foreground" />}>
                  <Input
                    type="time"
                    step={60}
                    min={getMinTime()}
                    placeholder="A partir de que horas?"
                    aria-label="Horário de início"  // A11y já que escondemos o label no desktop
                    className="h-12 text-base"
                    onClick={(e) => (e.currentTarget as HTMLInputElement).showPicker?.()}
                    onFocus={(e) => (e.currentTarget as HTMLInputElement).showPicker?.()}
                    {...field}
                  />
                </WithIcon>
              </FormControl>

              {/* Ajuda embaixo: mostra só no mobile para não “esticar” a linha no desktop */}
              <div className="text-xs text-muted-foreground flex items-center gap-1 md:hidden">
                <Clock className="h-3 w-3" />
                Mostraremos atividades a partir das{" "}
                <span className="font-medium">{field.value || "XX:XX"}</span>
              </div>

              <FormMessage />
            </FormItem>
          )}
        />

        {/* Botão */}
        
          <Button
            type="submit"
            className="h-12 px-6 text-base"
            disabled={!isFormValid || form.formState.isSubmitting}
          >
            Buscar atividades
          </Button>
      </form>
    </Form>
  );
}