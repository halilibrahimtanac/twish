"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { SubmitHandler, useForm } from "react-hook-form";
import { LoginInput, loginInput } from "@/server/routers/user/user.input";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormInput } from "@/components/ui/form-input";
import { Loader2 } from "lucide-react";
import { signIn } from "next-auth/react";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginInput>({
    resolver: zodResolver(loginInput),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  /* const login = trpc.user.login.useMutation({
    onSuccess: (res) => {
      setUserObject({
        ...res.user,
        profilePictureUrl: res.user.profilePictureUrl || undefined,
        backgroundPictureUrl: res.user.backgroundPictureUrl || undefined,
      });
      router.push("/home");
    },
    onError: (error) => {
      let parsedError: [keyof LoginInput, string][] | null = null;
      try {
        const obj = JSON.parse(error.message);
        if (obj && typeof obj === "object" && !Array.isArray(obj)) {
          parsedError = Object.entries(obj) as [keyof LoginInput, string][];
        }
      } catch {}
      if (parsedError && parsedError[0] && parsedError[0][0]) {
        setError(parsedError[0][0], {
          type: "validate",
          message: parsedError[0][1],
        });
      } else {
        setError("email", {
          type: "validate",
          message: error.message || "An unknown error occurred.",
        });
      }
    },
  }); */

  const onSubmit: SubmitHandler<LoginInput> = async (formData) => {
    try {
      setIsLoading(true);
      const result = await signIn("credentials", {
        redirect: false,
        email: formData.email,
        password: formData.password,
      });

      if (result?.error) {
        console.error(result.error);
        setError("email", {
          type: "manual",
          message: "Email veya şifre hatalı.",
        });
        setError("password", {
          type: "manual",
          message: "Email veya şifre hatalı.",
        });
        return;
      }

 
      router.push("/home");
      router.refresh();

    } catch (error) {
      console.log(error);
      setError("root", { message: "Beklenmedik bir hata oluştu." });
    }finally{
      setIsLoading(false);
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
          <CardTitle className="text-2xl">Giriş Yap</CardTitle>
          <CardDescription>
            Hesabınıza giriş yapmak için bilgilerinizi girin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
            <FormInput<LoginInput>
              label="E-posta"
              name="email"
              type="email"
              placeholder="m@example.com"
              register={register}
              errors={errors}
              autoComplete="username"
            />

            <FormInput<LoginInput>
              label="Şifre"
              name="password"
              type="password"
              placeholder="**********"
              register={register}
              errors={errors}
              autoComplete="current-password"
            />

            <div className="text-right text-sm">
              <Link href="/forgot-password" className="underline">
                Şifrenizi mi unuttunuz?
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || isSubmitting}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Giriş yapılıyor...
                </span>
              ) : (
                "Giriş Yap"
              )}
            </Button>

            <div className="mt-4 text-center text-sm">
              {"Hesabınız yok mu? "}
              <Link href="/signup" className="underline">
                Kayıt Ol
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}