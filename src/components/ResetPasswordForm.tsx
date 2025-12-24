"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string().min(1, "Please re-enter your password."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords must match.",
  });

type ResetForm = z.infer<typeof resetSchema>;

export default function ResetPasswordForm() {
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
      setServerError("Invalid link, please request a new one.");
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
          data.message || "Password could not be updated. Please try again.";
        setServerError(message);
        setError("password", { type: "validate", message });
        return;
      }

      toast.success("Your password has been updated.");
      router.push("/login");
    } catch (error) {
      console.error(error);
      setServerError("An unexpected error occurred. Please try again.");
      setError("password", {
        type: "validate",
        message: "An unexpected error occurred. Please try again.",
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
          <CardTitle className="text-2xl">Reset Password</CardTitle>
          <CardDescription>
            Set your new password to keep using Twish.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
            <FormInput<ResetForm>
              label="New Password"
              name="password"
              type="password"
              placeholder="**********"
              register={register}
              errors={errors}
              autoComplete="new-password"
            />

            <FormInput<ResetForm>
              label="New Password (repeat)"
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
                  Updating...
                </span>
              ) : (
                "Update Password"
              )}
            </Button>

            <div className="mt-2 text-center text-sm">
              <Link href="/login" className="underline">
                Back to login page
              </Link>
            </div>
          </form>

          {!token && (
            <div className="mt-4 rounded-md bg-muted p-3 text-sm">
              This link seems incomplete.{" "}
              <Link href="/forgot-password" className="underline">
                Request a new reset
              </Link>
              .
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
