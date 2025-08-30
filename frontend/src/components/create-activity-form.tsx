"use client";

import { useState, useCallback } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

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

const STATUS = ["open", "closed", "canceled"] as const;

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

// -------------------------------------------------------------
// Schema (corrigido)
// -------------------------------------------------------------
const schema = z.object({
  // Usa custom validator para não depender de tuple `as const`
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
  // sem default aqui para não tornar o INPUT opcional no resolver
  status: z.enum(STATUS),
  // capacity: number|null (null = sem limite)
  capacity: z.preprocess((v) => {
    if (v === null || v === undefined || v === "" || v === "null") return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : v;
  }, z.number().int().min(1, "Mínimo 1").max(500, "Máximo 500").nullable()),
}).refine((v) => {
  const today = toYMD(new Date());
  if (v.date === today) {
    return v.time >= nowHHMM();
  }
  return true;
}, { path: ["time"], message: "Use um horário no futuro" });

export type CreateActivityValues = z.infer<typeof schema>;

export type CreateActivityPayload = {
  creatorId: string;
  sport: SportId;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  cep: string;
  uf: UF;
  street?: string | "";
  title?: string | "";
  notes?: string | "";
  capacity: number | null;
  status: "open" | "closed" | "canceled";
  participants?: Array<{
    userId: string;
    joinedAt: string; // ISO
    role: "owner" | "member";
  }>;
  matches?: Array<{ userId: string; status: "accepted" | "pending" | "rejected"; at: string }>;
};

// -------------------------------------------------------------
// Component
// -------------------------------------------------------------
export default function CreateActivityForm({
  className,
  currentUserId,
  defaultUF = "SP",
  defaultCEP = "",
  onCreate,
}: {
  className?: string;
  currentUserId: string;
  defaultUF?: UF;
  defaultCEP?: string;
  onCreate?: (payload: CreateActivityPayload) => Promise<void> | void;
}) {
  const form = useForm<CreateActivityValues>({
    resolver: zodResolver(schema) as any,
    mode: "onChange",
    defaultValues: {
      sport: undefined as unknown as SportId,
      cep: formatCEP(defaultCEP),
      uf: defaultUF,
      date: "",
      time: "",
      street: "",
      title: "",
      notes: "",
      capacity: null, // null = sem limite
      status: "open", // default aqui (não no schema)
    },
  });

  const [openCal, setOpenCal] = useState(false);
  const [openSports, setOpenSports] = useState(false);
  const [openUF, setOpenUF] = useState(false);

  const todayYMD = toYMD(new Date());

  // ✅ Corrigido: Substituído useMemo por useCallback
  const getMinTime = useCallback(() => {
    const currentDate = form.getValues("date");
    return currentDate === todayYMD ? nowHHMM() : "00:00";
  }, [todayYMD]);

  // ✅ Corrigido: Usando formState.isValid ao invés de useMemo
  const isFormValid = form.formState.isValid;

  // UI helper (ícone à esquerda)
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

  // ✅ Corrigido: Otimizado setSport com useCallback
  const setSport = useCallback((id: SportId) => {
    form.setValue("sport", id, { shouldValidate: true, shouldDirty: true });
  }, [form]);

  // ✅ Para displays que precisam reagir a mudanças, mantemos o watch
  const selectedSport = form.watch("sport") as SportId | undefined;
  const selectedUF = form.watch("uf") as UF;
  const capacityIsNoLimit = form.watch("capacity") === null;

  // ✅ Corrigido: toggleNoLimit com useCallback
  const toggleNoLimit = useCallback((checked: boolean | "indeterminate") => {
    const v = !!checked;
    form.setValue("capacity", v ? null : (1 as unknown as number), {
      shouldValidate: true,
      shouldDirty: true,
    });
  }, [form]);

  async function submit(values: CreateActivityValues) {
    const payload: CreateActivityPayload = {
      creatorId: currentUserId,
      sport: values.sport,
      date: values.date,
      time: values.time,
      cep: values.cep.replace(/\D/g, "").replace(/^(\d{5})(\d{3})$/, "$1-$2"),
      uf: values.uf,
      street: values.street?.trim() ?? "",
      title: values.title?.trim() ?? "",
      notes: values.notes?.trim() ?? "",
      capacity: values.capacity ?? null,
      status: values.status,
      participants: [
        {
          userId: currentUserId,
          joinedAt: new Date().toISOString(),
          role: "owner",
        },
      ],
      matches: [],
    };

    if (onCreate) {
      await onCreate(payload);
    } else {
      // Por enquanto, apenas demonstração
      // eslint-disable-next-line no-console
      console.log("CreateActivity payload =>", payload);
    }

    form.reset({
      sport: undefined as unknown as SportId,
      cep: formatCEP(defaultCEP),
      uf: defaultUF,
      date: "",
      time: "",
      street: "",
      title: "",
      notes: "",
      capacity: null,
      status: "open",
    });
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(submit)}
        className={["grid grid-cols-1 gap-3", className].filter(Boolean).join(" ")}
      >
        {/* SPORT (single) */}
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
                                  {checked ? (
                                    <div className="h-2 w-2 rounded-full bg-amber-500" />
                                  ) : null}
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
                </WithIcon>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* UF */}
        <FormField
          control={form.control}
          name="uf"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Popover open={openUF} onOpenChange={setOpenUF}>
                  <PopoverTrigger asChild>
                    <div>
                      <WithIcon icon={<MapPin className="h-5 w-5 text-muted-foreground" />}>
                        <Button
                          type="button"
                          variant="outline"
                          className="h-12 w-full justify-between text-base"
                        >
                          {selectedUF ? `UF: ${selectedUF}` : "Selecione o estado (UF)"}
                          <ChevronDownIcon className="h-4 w-4 opacity-70" />
                        </Button>
                      </WithIcon>
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-[min(24rem,calc(100vw-2rem))] p-2">
                    <div className="grid grid-cols-4 gap-2">
                      {UFS.map((uf) => {
                        const checked = field.value === uf;
                        return (
                          <button
                            key={uf}
                            type="button"
                            onClick={() => {
                              field.onChange(uf);
                              setOpenUF(false);
                            }}
                            className={[
                              "rounded-md border px-2 py-1 text-sm",
                              checked ? "border-amber-500 bg-amber-50" : "hover:bg-muted",
                            ].join(" ")}
                          >
                            {uf}
                          </button>
                        );
                      })}
                    </div>
                  </PopoverContent>
                </Popover>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* DATE */}
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

        {/* TIME */}
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

        {/* STREET (opcional) */}
        <FormField
          control={form.control}
          name="street"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <WithIcon icon={<ListChecks className="h-5 w-5 text-muted-foreground" />}>
                  <Input
                    placeholder="Rua / complemento (opcional)"
                    className="h-12 text-base"
                    {...field}
                  />
                </WithIcon>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* TITLE (opcional) */}
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

        {/* NOTES (opcional) */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <WithIcon icon={<StickyNote className="h-5 w-5 text-muted-foreground" />}>
                  <Input
                    placeholder="Observações (ex.: 'Trazer colete')"
                    className="h-12 text-base"
                    {...field}
                  />
                </WithIcon>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* CAPACITY */}
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
                        if (v === "") {
                          field.onChange(null);
                        } else {
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

        {/* STATUS */}
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <div className="flex gap-2">
                  {STATUS.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => field.onChange(opt)}
                      className={[
                        "flex-1 rounded-md border px-3 py-2 text-sm capitalize",
                        field.value === opt ? "border-amber-500 bg-amber-50" : "hover:bg-muted",
                      ].join(" ")}
                      title={
                        opt === "open"
                          ? "Inscrições abertas"
                          : opt === "closed"
                          ? "Fechada para novas entradas"
                          : "Cancelada"
                      }
                    >
                      {opt}
                    </button>
                  ))}
                </div>
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
            disabled={!isFormValid || form.formState.isSubmitting}
          >
            Criar atividade
          </Button>
        </div>
      </form>
    </Form>
  );
}