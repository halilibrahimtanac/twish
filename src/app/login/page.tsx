"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { trpc } from "../_trpc/client";
import { useUserStore } from "@/lib/store/user.store";
import { SubmitHandler, useForm } from "react-hook-form";
import { LoginInput, loginInput } from "@/server/routers/user/user.input";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormInput } from "@/components/ui/form-input";

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useUserStore();

  // 3. Configure useForm with the zodResolver
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginInput>({
    resolver: zodResolver(loginInput), // This connects Zod to React Hook Form
    defaultValues: {
      // Good practice to set default values
      email: "",
      password: "",
    },
  });

  const login = trpc.user.login.useMutation({
    onSuccess: (res) => {
      setUser(res.user);
      router.push("/home");
    },
    onError: (error) => {
      let parsedError: [keyof LoginInput, string][] | null = null;
      try {
        const obj = JSON.parse(error.message);
        if (obj && typeof obj === "object" && !Array.isArray(obj)) {
          parsedError = Object.entries(obj) as [keyof LoginInput, string][];
        }
      } catch {

      }
      if (parsedError && parsedError[0] && parsedError[0][0]) {
        setError(parsedError[0][0], {
          type: "validate",
          message: parsedError[0][1],
        });
      } else {
        // fallback: set a generic error on email (or a form-level error if you have one)
        setError("email", {
          type: "validate",
          message: error.message || "An unknown error occurred.",
        });
      }
    },
  });

  const onSubmit: SubmitHandler<LoginInput> = async (
    formData
  ) => {
    try {
      await login.mutateAsync(formData);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center py-12">
      <Card className="mx-auto w-[350px]">
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
            <FormInput<LoginInput>
              label="Email"
              name="email"
              type="email"
              placeholder="m@example.com"
              register={register}
              errors={errors}
            />

            <FormInput<LoginInput>
              label="Password"
              name="password"
              type="password"
              placeholder="**********"
              register={register}
              errors={errors}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={login.isPending || isSubmitting}
            >
              {login.isPending ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin h-5 w-5 mr-2 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    ></path>
                  </svg>
                </span>
              ) : (
                "Login"
              )}
            </Button>

            <div className="mt-4 text-center text-sm">
              {"Don't have an account? "}
              <Link href="/signup" className="underline">
                Sign up
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
