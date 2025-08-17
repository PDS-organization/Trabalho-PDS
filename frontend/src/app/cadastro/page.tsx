"use client";

import { useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import StepHeader from "@/components/step-header";
import { SPORTS, SPORT_IDS, type SportId } from "@/data/sports";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { ChevronDownIcon } from "lucide-react";

import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

// ---------- VALIDAÇÕES ----------

// Step 1: nome, email, senha
const step1Schema = z.object({
  name: z.string().min(2, "Digite seu nome completo"),
  email: z.string().email("E-mail inválido"),
  password: z.string()
    .min(8, "Mínimo de 8 caracteres")
    .regex(/[A-Z]/, "Inclua ao menos 1 letra maiúscula")
    .regex(/[a-z]/, "Inclua ao menos 1 letra minúscula")
    .regex(/[0-9]/, "Inclua ao menos 1 número"),
});

// Step 2: diga mais sobre você
const cepRegex = /^\d{5}-?\d{3}$/; // 00000-000 ou 00000000
const genderOptions = ["masculino", "feminino", "nao_informar", "outro"] as const;

const step2Schema = z.object({
  birthdate: z.string().min(1, "Selecione sua data"),
  gender: z.enum(genderOptions),
  cep: z.string()
    .min(8, "CEP obrigatório")
    .regex(cepRegex, "CEP no formato 00000-000"),
  uf: z.string().min(2, "Informe o estado"),
  street: z.string().min(1, "Informe a rua"),
});

const step3Schema = z.object({
  sports: z.array(z.enum(SPORT_IDS)).min(1, "Selecione pelo menos 1 esporte"),
});

// Schema total (união dos steps)
const fullSchema = step1Schema.and(step2Schema).and(step3Schema);

type FormValues = z.infer<typeof fullSchema>;

// ---------- HELPERS ----------

async function fetchViaCep(cep: string) {
  // normaliza para só dígitos
  const onlyDigits = cep.replace(/\D/g, "");
  const res = await fetch(`https://viacep.com.br/ws/${onlyDigits}/json/`);
  if (!res.ok) throw new Error("Falha ao consultar ViaCEP");
  const data = await res.json();
  if (data.erro) throw new Error("CEP não encontrado");
  // mapeia campos de interesse
  return {
    uf: data.uf as string,                    // Estado (ex: "SP")
    street: data.logradouro as string,        // Rua
    // você pode usar também: data.localidade (cidade), data.bairro, etc.
  };
}

function toYMD(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;               // "YYYY-MM-DD" (sem timezone bug)
}

function parseYMD(s: string | undefined) {
  if (!s) return undefined;
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d);          // Date local
}

function formatBR(s: string | undefined) {
  if (!s) return "";
  const [y, m, d] = s.split("-");
  return `${d}/${m}/${y}`;               // "DD/MM/YYYY"
}

export default function CadastroPage() {
  const router = useRouter();
  const [birthOpen, setBirthOpen] = useState(false);


  const [step, setStep] = useState<1 | 2 | 3>(1);

  const form = useForm<FormValues>({
    resolver: zodResolver(fullSchema),
    mode: "onTouched",
    defaultValues: {
      // step 1
      name: "",
      email: "",
      password: "",
      // step 2
      birthdate: "",
      gender: "nao_informar",
      cep: "",
      uf: "",
      street: "",
      // step 3
      sports: [] as SportId[],
    },
  });

  // Só para habilitar/desabilitar botão “Próximo/Concluir”
  const isStep1Valid = useMemo(() => {
    const v = step1Schema.safeParse({
      name: form.getValues("name"),
      email: form.getValues("email"),
      password: form.getValues("password"),
    });
    return v.success;
  }, [form.watch("name"), form.watch("email"), form.watch("password")]);

  const isStep2Valid = useMemo(() => {
    const v = step2Schema.safeParse({
      birthdate: form.getValues("birthdate"),
      gender: form.getValues("gender"),
      cep: form.getValues("cep"),
      uf: form.getValues("uf"),
      street: form.getValues("street"),
    });
    return v.success;
  }, [form.watch("birthdate"), form.watch("gender"), form.watch("cep"), form.watch("uf"), form.watch("street")]);

  const isStep3Valid = useMemo(() => {
    const v = step3Schema.safeParse({
      sports: form.getValues("sports"),
    });
    return v.success;
  }, [form.watch("sports")]);

  // Consulta ViaCEP quando CEP perde foco ou atinge 8 dígitos
  async function handleCepLookup() {
    const cep = form.getValues("cep");
    if (!cepRegex.test(cep)) return;
    try {
      const { uf, street } = await fetchViaCep(cep);
      form.setValue("uf", uf ?? "");
      form.setValue("street", street ?? "");
    } catch (err: any) {
      toast.error("CEP inválido ou não encontrado");
    }
  }

  async function onSubmit(values: FormValues) {
    try {
      const res = await fetch("/api/fake/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error("Falha ao salvar", { description: data?.message ?? "Tente novamente." });
        return;
      }

      toast.success("Cadastro salvo localmente! (fake backend)");
      router.push("/"); // habilite se quiser redirecionar
    } catch (e) {
      toast.error("Erro inesperado", { description: "Verifique a conexão." });
    }
  }

  return (
    <main className="min-h-screen p-4 flex items-start justify-center">
      <div className="w-full max-w-md">
        {/* Cabeçalho (mobile-first) */}
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold">Criar conta</h1>
            <span className="text-xs text-muted-foreground">Passo {step} de 3</span>
          </div>

          {/* Indicador de progresso segmentado (2 retângulos) */}
          <div className="mt-3 space-y-2">
            <div className="flex gap-1 sm:gap-1.5">
              <div className={`h-2 flex-1 rounded ${step >= 1 ? "bg-primary" : "bg-muted"}`} />
              <div className={`h-2 flex-1 rounded ${step >= 2 ? "bg-primary" : "bg-muted"}`} />
              <div className={`h-2 flex-1 rounded ${step >= 3 ? "bg-primary" : "bg-muted"}`} />

            </div>
          </div>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6"
          >
            {/* ---------- STEP 1 ---------- */}
            {step === 1 && (
              <div className="space-y-4">
                <StepHeader
                  title="Informações para criar a conta"
                  sub="Vamos começar com seu nome, e-mail e senha."
                />
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Seu nome"
                          autoComplete="name"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-mail</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="voce@exemplo.com"
                          autoComplete="email"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="********"
                          autoComplete="new-password"
                          {...field}
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground mt-1">
                        Mín. 8 chars, 1 maiúscula, 1 minúscula e 1 número.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    className="flex-1"
                    onClick={() => router.push("/")}
                  >
                    Voltar
                  </Button>

                  <Button
                    type="button"
                    className="flex-1"
                    onClick={() => setStep(2)}
                    disabled={!isStep1Valid}
                  >
                    Próximo
                  </Button>
                </div>
              </div>
            )}

            {/* ---------- STEP 2 ---------- */}
            {step === 2 && (
              <div className="space-y-4">
                <StepHeader
                  title="Me diga mais sobre você"
                  sub="Utilizaremos essas informações para encontrar parceiros de treino próximos!"
                />
                <FormField
                  control={form.control}
                  name="birthdate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data de nascimento</FormLabel>

                      <Popover open={birthOpen} onOpenChange={setBirthOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              type="button"
                              variant="outline"
                              id="birthdate"
                              className="w-full justify-between font-normal"
                            >
                              {field.value ? formatBR(field.value) : "Selecione a data"}
                              <ChevronDownIcon className="h-4 w-4 opacity-70" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>

                        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={parseYMD(field.value)}
                            captionLayout="dropdown"               // igual ao exemplo
                            onSelect={(date) => {
                              if (date) {
                                field.onChange(toYMD(date));       // salva como "YYYY-MM-DD"
                                setBirthOpen(false);
                              }
                            }}
                          // opcionais:
                          // disabled={(d) => d > new Date()}     // evita datas futuras
                          // fromYear={1950} toYear={new Date().getFullYear()}
                          />
                        </PopoverContent>
                      </Popover>

                      <FormMessage />
                    </FormItem>
                  )}
                />


                {/* Gênero */}
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gênero</FormLabel>
                      <FormControl>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="masculino">Masculino</SelectItem>
                            <SelectItem value="feminino">Feminino</SelectItem>
                            <SelectItem value="outro">Outro</SelectItem>
                            <SelectItem value="nao_informar">Prefiro não informar</SelectItem>
                          </SelectContent>
                        </Select>
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
                      <FormLabel>CEP</FormLabel>
                      <FormControl>
                        <Input
                          inputMode="numeric"
                          placeholder="00000-000"
                          {...field}
                          onBlur={async (e) => {
                            field.onBlur?.();
                            await handleCepLookup();
                          }}
                          onChange={(e) => {
                            // máscara simples 00000-000
                            const digits = e.target.value.replace(/\D/g, "").slice(0, 8);
                            const masked = digits.replace(/^(\d{5})(\d{0,3}).*/, (_, a, b) =>
                              b ? `${a}-${b}` : a
                            );
                            field.onChange(masked);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="sm:w-44">  {/* coluna estreita p/ UF */}
                    {/* --- UF --- */}
                    <FormField
                      control={form.control}
                      name="uf"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estado (UF)</FormLabel>
                          <FormControl>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Selecione seu estado" />
                              </SelectTrigger>
                              <SelectContent>
                                {[
                                  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO",
                                  "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI",
                                  "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
                                ].map((uf) => (
                                  <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="sm:flex-1"> {/* rua ocupa o resto */}
                    {/* --- Rua --- */}
                    <FormField
                      control={form.control}
                      name="street"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rua</FormLabel>
                          <FormControl>
                            <Input className="w-full" placeholder="Nome da rua" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    className="flex-1"
                    onClick={() => setStep(1)}
                  >
                    Voltar
                  </Button>

                  <Button
                    type="button"
                    className="flex-1"
                    onClick={() => setStep(3)}
                    disabled={!isStep2Valid}
                  >
                    Próximo
                  </Button>
                </div>
              </div>
            )}
            {/* ---------- STEP 3 ---------- */}
            {step === 3 && (
              <div className="space-y-4">
                <StepHeader
                  title="Quais esportes você gosta ou gostaria de praticar?"
                  sub="Você pode escolher mais de um."
                />

                <FormField
                  control={form.control}
                  name="sports"
                  render={({ field }) => {
                    const selected = (field.value as SportId[]) ?? [];

                    const toggle = (id: SportId) => {
                      if (selected.includes(id)) {
                        field.onChange(selected.filter((s) => s !== id));
                      } else {
                        field.onChange([...selected, id]);
                      }
                    };

                    return (
                      <div className="space-y-2">
                        <div className="grid grid-cols-3 gap-3 max-h-80 overflow-y-auto pr-1">
                          {SPORTS.map((s) => {
                            const active = selected.includes(s.id);
                            return (
                              <button
                                type="button"
                                key={s.id}
                                onClick={() => toggle(s.id)}
                                className={[
                                  "w-full h-24",
                                  "flex flex-col items-center justify-center gap-2",
                                  "rounded-xl p-3 border text-xs sm:text-sm",
                                  "bg-card",
                                  "group",
                                  "transition-[transform,background-color,border-color,box-shadow] duration-150 motion-reduce:transition-none",
                                  "hover:bg-amber-50/40 hover:border-amber-300",
                                  "cursor-pointer select-none active:scale-95 active:translate-y-0 active:shadow-sm",
                                  active
                                    ? "border-amber-500 bg-amber-50 ring-1 ring-amber-200"
                                    : "border-border hover:ring-0",
                                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2",
                                ].join(" ")}
                                aria-pressed={active}
                              >
                                <div className="grid place-items-center h-8 w-8 sm:h-9 sm:w-9">
                                  <s.Icon
                                    className={[
                                      "h-7 w-7 sm:h-8 sm:w-8",
                                      "block mx-auto shrink-0",
                                      active ? "text-amber-500" : "text-foreground"
                                    ].join(" ")}
                                  />
                                </div>
                                <div className="mt-2">{s.label}</div>
                              </button>
                            );
                          })}
                        </div>
                        <FormMessage />
                      </div>
                    );
                  }}
                />

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    className="flex-1"
                    onClick={() => setStep(2)}
                  >
                    Voltar
                  </Button>

                  <Button
                    type="submit"
                    className={["flex-1"
                    ].join(" ")}
                    disabled={!isStep3Valid || form.formState.isSubmitting}

                  >
                    SIMBORA!
                  </Button>
                </div>
              </div>
            )}

          </form>
        </Form>
      </div>
    </main>
  );
}
