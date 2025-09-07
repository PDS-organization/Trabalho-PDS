"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import StepHeader from "@/components/step-header";
import { SPORTS, SPORT_IDS, type SportId } from "../../data/sports";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { ChevronDownIcon } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";


const USERNAME_RE = /^(?=(?:.*[a-z]){5,})[a-z0-9_]{5,20}$/;

function stripDiacritics(s: string) {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "");
}
export function normalizeUsername(s: string) {
  const base = stripDiacritics(s.toLowerCase());
  return base.replace(/[^a-z0-9_]/g, "_").replace(/_+/g, "_").replace(/^_+|_+$/g, "");
}

const step1Schema = z.object({
  name: z.string().min(2, "Digite seu nome completo"),
  email: z.string().email("E-mail inválido"),
  password: z.string()
    .min(8, "Mínimo de 8 caracteres")
    .regex(/[A-Z]/, "Inclua ao menos 1 letra maiúscula")
    .regex(/[a-z]/, "Inclua ao menos 1 letra minúscula")
    .regex(/[0-9]/, "Inclua ao menos 1 número"),
  username: z.string()
    .transform((v) => normalizeUsername(v))
    .refine((v) => USERNAME_RE.test(v), "Use 5-20 caracteres"),
  phone: z.string().min(10, "Informe seu telefone"),
});

const cepRegex = /^\d{5}-?\d{3}$/;
const genderOptions = ["MASCULINO", "FEMININO", "NAO_INFORMAR", "OUTRO"] as const;

const step2Schema = z.object({
  birthdate: z.string().min(1, "Selecione sua data"),
  gender: z.enum(genderOptions),
  cep: z.string().min(8, "CEP obrigatório").regex(cepRegex, "CEP no formato 00000-000"),
  uf: z.string().min(2, "Informe o estado"),
  street: z.string().min(1, "Informe a rua"),
}).refine((v) => {
  const [y,m,d] = v.birthdate.split("-").map(Number);
  const when = new Date(y, (m||1)-1, d||1).setHours(0,0,0,0);
  const today = new Date().setHours(0,0,0,0);
  return when <= today;
}, { path: ["birthdate"], message: "A data deve ser no passado" });

const step3Schema = z.object({
  sports: z.array(z.enum(SPORT_IDS)).min(1, "Selecione pelo menos 1 esporte"),
});

const fullSchema = step1Schema.and(step2Schema).and(step3Schema);
type FormValues = z.infer<typeof fullSchema>;

async function fetchViaCep(cep: string) {
  const onlyDigits = cep.replace(/\D/g, "");
  const res = await fetch(`https://viacep.com.br/ws/${onlyDigits}/json/`);
  if (!res.ok) throw new Error("Falha ao consultar ViaCEP");
  const data = await res.json();
  if (data.erro) throw new Error("CEP não encontrado");
  return { uf: data.uf as string, street: data.logradouro as string };
}
function toYMD(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}
function parseYMD(s: string | undefined) {
  if (!s) return undefined;
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d);
}
function formatBR(s: string | undefined) {
  if (!s) return "";
  const [y, m, d] = s.split("-");
  return `${d}/${m}/${y}`;
}

export default function CadastroPage() {
  const router = useRouter();
  const [birthOpen, setBirthOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const form = useForm<FormValues>({
    resolver: zodResolver(fullSchema),
    mode: "onTouched",
    defaultValues: {
      name: "",
      username: "",
      email: "",
      password: "",
      birthdate: "",
      phone: "",
      gender: "NAO_INFORMAR",
      cep: "",
      uf: "",
      street: "",
      sports: [] as SportId[],
    },
  });



  const isStep1Valid = useMemo(() => {
    const v = step1Schema.safeParse({
      name: form.getValues("name"),
      email: form.getValues("email"),
      username: form.getValues("username"),
      password: form.getValues("password"),
      phone: form.getValues("phone"),
    });
    return v.success;
  }, [form.watch("name"), form.watch("email"), form.watch("username"), form.watch("password"), form.watch("phone"),]);

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
    const v = step3Schema.safeParse({ sports: form.getValues("sports") });
    return v.success;
  }, [form.watch("sports")]);

  async function handleCepLookup() {
    const cep = form.getValues("cep");
    if (!cepRegex.test(cep)) return;
    try {
      const { uf, street } = await fetchViaCep(cep);
      form.setValue("uf", uf ?? "");
      form.setValue("street", street ?? "");
    } catch {
      toast.error("CEP inválido ou não encontrado");
    }
  }

  async function onSubmit(values: FormValues) {
    try {
      const dto = {
        name: values.name,
        genero: values.gender,
        username: values.username,            
        email: values.email,
        dataNascimento: values.birthdate,     // "YYYY-MM-DD"
        password: values.password,
        phone: values.phone,
        cep: values.cep.replace(/\D/g, ""),   // só dígitos
        uf: values.uf.toUpperCase(),
        street: values.street,
        modalidadesNomes: values.sports
      };

      const res = await fetch(`${API}/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dto),
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 409 || data?.code === "USERNAME_TAKEN") {
        form.setError("username", { message: "Este username já está em uso" });
        setStep(1);
        return;
      }
      if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);

      toast.success("Conta criada!");
      router.push("/login");
    } catch (err: any) {
      toast.error("Falha no cadastro", { description: err.message ?? "Tente novamente." });
    }
  }


  return (
    <main className="min-h-screen p-4 flex items-start justify-center">
      <div className="w-full max-w-md">
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold">Criar conta</h1>
            <span className="text-xs text-muted-foreground">Passo {step} de 3</span>
          </div>
          <div className="mt-3 space-y-2">
            <div className="flex gap-1 sm:gap-1.5">
              <div className={`h-2 flex-1 rounded ${step >= 1 ? "bg-primary" : "bg-muted"}`} />
              <div className={`h-2 flex-1 rounded ${step >= 2 ? "bg-primary" : "bg-muted"}`} />
              <div className={`h-2 flex-1 rounded ${step >= 3 ? "bg-primary" : "bg-muted"}`} />
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {step === 1 && (
              <div className="space-y-4">
                <StepHeader title="Informações para criar a conta" sub="Vamos começar com seu nome, e-mail, senha e username." />
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input placeholder="Seu nome" autoComplete="name" {...field} />
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
                        <Input type="email" placeholder="voce@exemplo.com" autoComplete="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input placeholder="seu_username" {...field} onChange={(e) => field.onChange(normalizeUsername(e.target.value))} />
                          {/* <span className="absolute inset-y-0 right-2 flex items-center">
                            feedback
                          </span> */}
                        </div>
                      </FormControl>
                      <div className="min-h-5">
                        <p className="text-xs text-muted-foreground">A disponibilidade será verificada ao finalizar o cadastro.</p>
                      </div>
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
                        <Input type="password" placeholder="********" autoComplete="new-password" {...field} />
                      </FormControl>
                      <p className="text-xs text-muted-foreground mt-1">Mín. 8 chars, 1 maiúscula, 1 minúscula e 1 número.</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          placeholder="(34) 98765-4321"
                          inputMode="tel"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex gap-2">
                  <Button type="button" variant="secondary" className="flex-1" onClick={() => router.push("/")}>
                    Voltar
                  </Button>
                  <Button type="button" className="flex-1" onClick={() => setStep(2)} disabled={!isStep1Valid}>
                    Próximo
                  </Button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <StepHeader title="Me diga mais sobre você" sub="Utilizaremos essas informações para encontrar parceiros de treino próximos!" />
                <FormField
                  control={form.control}
                  name="birthdate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data de nascimento</FormLabel>
                      <Popover open={birthOpen} onOpenChange={setBirthOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button type="button" variant="outline" id="birthdate" className="w-full justify-between font-normal">
                              {field.value ? formatBR(field.value) : "Selecione a data"}
                              <ChevronDownIcon className="h-4 w-4 opacity-70" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={parseYMD(field.value)}
                            captionLayout="dropdown"
                            onSelect={(date) => {
                              if (date) {
                                field.onChange(toYMD(date));
                                setBirthOpen(false);
                              }
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                            <SelectItem value="MASCULINO">Masculino</SelectItem>
                            <SelectItem value="FEMININO">Feminino</SelectItem>
                            <SelectItem value="OUTRO">Outro</SelectItem>
                            <SelectItem value="NAO_INFORMAR">Prefiro não informar</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                            const digits = e.target.value.replace(/\D/g, "").slice(0, 8);
                            const masked = digits.replace(/^(\d{5})(\d{0,3}).*/, (_, a, b) => (b ? `${a}-${b}` : a));
                            field.onChange(masked);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="sm:w-44">
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
                                  "AC",
                                  "AL",
                                  "AP",
                                  "AM",
                                  "BA",
                                  "CE",
                                  "DF",
                                  "ES",
                                  "GO",
                                  "MA",
                                  "MT",
                                  "MS",
                                  "MG",
                                  "PA",
                                  "PB",
                                  "PR",
                                  "PE",
                                  "PI",
                                  "RJ",
                                  "RN",
                                  "RS",
                                  "RO",
                                  "RR",
                                  "SC",
                                  "SP",
                                  "SE",
                                  "TO",
                                ].map((uf) => (
                                  <SelectItem key={uf} value={uf}>
                                    {uf}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="sm:flex-1">
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
                  <Button type="button" variant="secondary" className="flex-1" onClick={() => setStep(1)}>
                    Voltar
                  </Button>
                  <Button type="button" className="flex-1" onClick={() => setStep(3)} disabled={!isStep2Valid}>
                    Próximo
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <StepHeader title="Quais esportes você gosta ou gostaria de praticar?" sub="Você pode escolher mais de um." />
                <FormField
                  control={form.control}
                  name="sports"
                  render={({ field }) => {
                    const selected = (field.value as SportId[]) ?? [];
                    const toggle = (id: SportId) => {
                      if (selected.includes(id)) field.onChange(selected.filter((s) => s !== id));
                      else field.onChange([...selected, id]);
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
                                  active ? "border-amber-500 bg-amber-50 ring-1 ring-amber-200" : "border-border hover:ring-0",
                                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2",
                                ].join(" ")}
                                aria-pressed={active}
                              >
                                <div className="grid place-items-center h-8 w-8 sm:h-9 sm:w-9">
                                  <s.Icon
                                    className={["h-7 w-7 sm:h-8 sm:w-8", "block mx-auto shrink-0", active ? "text-amber-500" : "text-foreground"].join(
                                      " "
                                    )}
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
                  <Button type="button" variant="secondary" className="flex-1" onClick={() => setStep(2)}>
                    Voltar
                  </Button>
                  <Button type="submit" className="flex-1" disabled={!isStep3Valid || form.formState.isSubmitting}>
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
