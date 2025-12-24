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
  email: z.string().email("Enter a valid email."),
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
          message: data.message || "Could not create password reset link.",
        });
        return;
      }

      toast.success("If this email is registered, a link has been sent.");

      if (data.resetUrl) {
        setDevResetUrl(data.resetUrl as string);
      }
    } catch (error) {
      console.error(error);
      setError("email", {
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
          <CardTitle className="text-2xl">Forgot Password</CardTitle>
          <CardDescription>
            Enter the email linked to your account and {"we'll"} send you a link.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
            <FormInput<ForgotForm>
              label="Email"
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
                  Sending...
                </span>
              ) : (
                "Send Link"
              )}
            </Button>

            <div className="mt-2 text-center text-sm">
              <Link href="/login" className="underline">
                Back to login page
              </Link>
            </div>
          </form>

          {devResetUrl && (
            <div className="mt-4 rounded-md bg-muted p-3 text-sm break-all">
              <div className="font-medium">Development link</div>
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
