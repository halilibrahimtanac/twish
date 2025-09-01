"use client";

import { trpc } from "../_trpc/client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { addUserInput, AddUserInput } from "@/server/routers/user/user.input";
import { FormInput } from "@/components/ui/form-input";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function SignupPage() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<AddUserInput>({
    resolver: zodResolver(addUserInput),
    defaultValues: {
      name: "",
      email: "",
      username: "",
      password: "",
      confirmPassword: "",
    },
  });

  const addUser = trpc.user.addUser.useMutation({
    onSuccess: () => {
      toast("Hesap oluşturuldu, giriş yapınız.");
      router.push("/login");
    },
    onError: (error) => {
      try {
        const parsedError = Object.entries(JSON.parse(error.message)) as [
          keyof AddUserInput,
          string
        ][];
        if (parsedError[0] && parsedError[0][0]) {
          setError(parsedError[0][0], {
            type: "validate",
            message: parsedError[0][1],
          });
        }
      } catch {
        setError("root.serverError", {
          type: "validate",
          message: error.message || "Bilinmeyen bir hata oluştu.",
        });
      }
    },
  });

  const onSubmit: SubmitHandler<AddUserInput> = async (
    formData: AddUserInput
  ) => {
    try {
      await addUser.mutateAsync(formData);
    } catch (error) {
      console.log(error);
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
              priority
            />
          </div>
          <CardTitle className="text-2xl">Kayıt Ol</CardTitle>
          <CardDescription>
            Hesap oluşturmak için bilgilerinizi girin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
            <FormInput<AddUserInput>
              label="Ad Soyad"
              name="name"
              type="text"
              placeholder="John Doe"
              register={register}
              errors={errors}
            />
            <FormInput<AddUserInput>
              label="E-posta"
              name="email"
              type="email"
              placeholder="m@example.com"
              register={register}
              errors={errors}
            />
            <FormInput<AddUserInput>
              label="Kullanıcı Adı"
              name="username"
              type="text"
              placeholder="kullaniciadi"
              register={register}
              errors={errors}
            />
            <FormInput<AddUserInput>
              label="Şifre"
              name="password"
              type="password"
              placeholder="*********"
              register={register}
              errors={errors}
            />
            <FormInput<AddUserInput>
              label="Şifreyi Onayla"
              name="confirmPassword"
              type="password"
              placeholder="*********"
              register={register}
              errors={errors}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={addUser.isPending || isSubmitting}
            >
              {addUser.isPending ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Hesap oluşturuluyor...
                </span>
              ) : (
                "Kayıt Ol"
              )}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Zaten bir hesabınız var mı?{" "}
            <Link href="/login" className="underline">
              Giriş yap
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}