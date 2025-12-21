"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
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

const forgotSchema = z.object({
  email: z.string().email("Geçerli bir e-posta girin."),
});

type ForgotForm = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<ForgotForm>({
    resolver: zodResolver(forgotSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (values: ForgotForm) => {
    setDevResetUrl(null);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError("email", {
          type: "validate",
          message: data.message || "Şifre sıfırlama bağlantısı oluşturulamadı.",
        });
        return;
      }

      toast.success("Eğer bu e-posta kayıtlıysa bağlantı gönderildi.");

      if (data.resetUrl) {
        setDevResetUrl(data.resetUrl as string);
      }
    } catch (error) {
      console.error(error);
      setError("email", {
        type: "validate",
        message: "Beklenmedik bir hata oluştu. Lütfen tekrar deneyin.",
      });
    }
  };

  return (
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
          <CardTitle className="text-2xl">Şifremi Unuttum</CardTitle>
          <CardDescription>
            Hesabınıza bağlı e-postayı girin, size bir bağlantı gönderelim.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
            <FormInput<ForgotForm>
              label="E-posta"
              name="email"
              type="email"
              placeholder="m@example.com"
              register={register}
              errors={errors}
              autoComplete="email"
            />

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gönderiliyor...
                </span>
              ) : (
                "Bağlantı Gönder"
              )}
            </Button>

            <div className="mt-2 text-center text-sm">
              <Link href="/login" className="underline">
                Giriş sayfasına dön
              </Link>
            </div>
          </form>

          {devResetUrl && (
            <div className="mt-4 rounded-md bg-muted p-3 text-sm break-all">
              <div className="font-medium">Geliştirme bağlantısı</div>
              <Link href={devResetUrl} className="underline">
                {devResetUrl}
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
