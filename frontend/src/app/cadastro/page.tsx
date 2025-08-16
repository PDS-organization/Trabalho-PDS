"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

import { signup } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";

const schema = z.object({
  name: z.string().min(2, "Digite seu nome completo"),
  email: z.string().email("E-mail inválido"),
  password: z.string()
    .min(8, "Mínimo de 8 caracteres")
    .regex(/[A-Z]/, "Inclua ao menos 1 letra maiúscula")
    .regex(/[a-z]/, "Inclua ao menos 1 letra minúscula")
    .regex(/[0-9]/, "Inclua ao menos 1 número"),
  confirmPassword: z.string(),
  acceptTerms: z.boolean().refine(v => v, "Você precisa aceitar os termos"),
}).refine((v) => v.password === v.confirmPassword, {
  message: "As senhas não conferem",
  path: ["confirmPassword"],
});

type FormValues = z.infer<typeof schema>;

function passwordScore(pw: string): number {
  // score simples de 0 a 100
  let s = 0;
  if (!pw) return 0;
  if (pw.length >= 8) s += 25;
  if (/[A-Z]/.test(pw)) s += 25;
  if (/[a-z]/.test(pw)) s += 25;
  if (/[0-9]/.test(pw) || /[^A-Za-z0-9]/.test(pw)) s += 25;
  return s;
}

export default function CadastroPage() {
  const router = useRouter();
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
    mode: "onTouched",
  });

  const pw = form.watch("password");
  const score = useMemo(() => passwordScore(pw), [pw]);
  const submitting = form.formState.isSubmitting;

  async function onSubmit(values: FormValues) {
    const payload = {
      name: values.name.trim(),
      email: values.email.trim().toLowerCase(),
      password: values.password,
      acceptTerms: values.acceptTerms,
    };

    const res = await signup(payload);

    if (!res.ok) {
      toast.error("Falha no cadastro", { description: res.message });
      return;
    }

    toast.success("Conta criada com sucesso!");
    router.push("/login");
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold">Criar conta</h1>
          <p className="text-sm text-muted-foreground">Preencha seus dados para começar</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* Nome */}
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

            {/* E-mail */}
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

            {/* Senha */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input
                        type={showPw ? "text" : "password"}
                        placeholder="********"
                        autoComplete="new-password"
                        {...field}
                      />
                    </FormControl>
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1"
                      onClick={() => setShowPw((v) => !v)}
                      aria-label={showPw ? "Ocultar senha" : "Mostrar senha"}
                    >
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  {/* Requisitos + Força */}
                  <div className="space-y-2 mt-2">
                    <Progress value={score} />
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• Mínimo de 8 caracteres</li>
                      <li>• Pelo menos 1 maiúscula, 1 minúscula e 1 número</li>
                    </ul>
                  </div>

                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Confirmar Senha */}
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmar senha</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input
                        type={showPw2 ? "text" : "password"}
                        placeholder="********"
                        autoComplete="new-password"
                        {...field}
                      />
                    </FormControl>
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1"
                      onClick={() => setShowPw2((v) => !v)}
                      aria-label={showPw2 ? "Ocultar confirmacao" : "Mostrar confirmacao"}
                    >
                      {showPw2 ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Termos */}
            <FormField
              control={form.control}
              name="acceptTerms"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className="font-normal">
                    Eu li e aceito os{" "}
                    <a href="/termos" className="underline underline-offset-2" target="_blank">
                      Termos de Uso
                    </a>{" "}
                    e a{" "}
                    <a href="/privacidade" className="underline underline-offset-2" target="_blank">
                      Política de Privacidade
                    </a>.
                  </FormLabel>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={submitting || !form.formState.isValid}
            >
              {submitting ? "Cadastrando..." : "Criar conta"}
            </Button>
          </form>
        </Form>
      </div>
    </main>
  );
}
