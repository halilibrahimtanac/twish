"use client";
import { trpc } from "../_trpc/client";
import { useRouter } from "next/navigation";
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

export default function Home() {
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
      router.push("/login");
    },
    onError: (error) => {
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
    <div className="w-full h-screen flex items-center justify-center py-12">
      <Card className="w-1/3">
        <CardHeader>
          <CardTitle className="text-xl">Sign Up</CardTitle>
          <CardDescription>
            Enter your information to create an account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
          <FormInput<AddUserInput>
              label="Name"
              name="name"
              type="text"
              placeholder="John Doe"
              register={register}
              errors={errors}
            />
            <FormInput<AddUserInput>
              label="Email"
              name="email"
              type="email"
              placeholder="m@example.com"
              register={register}
              errors={errors}
            />
            <FormInput<AddUserInput>
              label="Username"
              name="username"
              type="text"
              placeholder="username"
              register={register}
              errors={errors}
            />
            <FormInput<AddUserInput>
              label="Password"
              name="password"
              type="password"
              placeholder="*********"
              register={register}
              errors={errors}
            />
            <FormInput<AddUserInput>
              label="Confirm Password"
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
                "Signup"
              )}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Already have an account?{" "}
            <Link href="/login" className="underline">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
