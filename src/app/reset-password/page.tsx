"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FormInput } from "@/components/ui/form-input";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const resetSchema = z
  .object({
    password: z.string().min(8, "Şifre en az 8 karakter olmalı."),
    confirmPassword: z.string().min(1, "Şifreyi tekrar girin."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Şifreler aynı olmalı.",
  });

type ResetForm = z.infer<typeof resetSchema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);

  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    setServerError(null);
  }, [token]);

  const onSubmit = async (values: ResetForm) => {
    if (!token) {
      setServerError("Geçersiz bağlantı, lütfen yeni bir talep oluşturun.");
      return;
    }

    setServerError(null);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...values, token }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        const message =
          data.message || "Şifre güncellenemedi. Lütfen tekrar deneyin.";
        setServerError(message);
        setError("password", { type: "validate", message });
        return;
      }

      toast.success("Şifreniz güncellendi.");
      router.push("/login");
    } catch (error) {
      console.error(error);
      setServerError("Beklenmedik bir hata oluştu. Lütfen tekrar deneyin.");
      setError("password", {
        type: "validate",
        message: "Beklenmedik bir hata oluştu. Lütfen tekrar deneyin.",
      });
    }
  };

  return (
    <Suspense fallback={<div>Loading...</div>}>
    <div className="flex min-h-screen w-full items-center justify-center bg-muted/40 p-4">
      <Card className="mx-auto w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
            <Image
              src="/twish-logo-preview.png"
              alt="Twish Logo"
              width={180}
              height={105}
            />
          </div>
          <CardTitle className="text-2xl">Şifreyi Sıfırla</CardTitle>
          <CardDescription>
            Yeni şifrenizi belirleyin ve giriş yapmaya devam edin.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
            <FormInput<ResetForm>
              label="Yeni şifre"
              name="password"
              type="password"
              placeholder="**********"
              register={register}
              errors={errors}
              autoComplete="new-password"
            />

            <FormInput<ResetForm>
              label="Yeni şifre (tekrar)"
              name="confirmPassword"
              type="password"
              placeholder="**********"
              register={register}
              errors={errors}
              autoComplete="new-password"
            />

            {serverError && (
              <p className="text-sm text-red-600">{serverError}</p>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Güncelleniyor...
                </span>
              ) : (
                "Şifreyi Güncelle"
              )}
            </Button>

            <div className="mt-2 text-center text-sm">
              <Link href="/login" className="underline">
                Giriş sayfasına dön
              </Link>
            </div>
          </form>

          {!token && (
            <div className="mt-4 rounded-md bg-muted p-3 text-sm">
              Bu bağlantı eksik görünüyor.{" "}
              <Link href="/forgot-password" className="underline">
                Yeni bir sıfırlama iste
              </Link>
              .
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </Suspense>
  );
}
