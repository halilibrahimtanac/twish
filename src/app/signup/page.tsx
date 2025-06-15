"use client";
import { trpc } from "../_trpc/client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
  });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [error, setError] = useState("");

  const addUser = trpc.user.addUser.useMutation({
    onSuccess: () => {
      router.push("/login");
    },
    onError: (error) => {
      setError(JSON.parse(error.message));
    },
  });

  const handleSubmit = async () => {
    setError("");
    try {
      await addUser.mutateAsync(formData);
    } catch (error) {
      console.log(error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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
              <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="first-name">Name</Label>
                    <Input
                      id="first-name"
                      name="name"
                      placeholder="Max"
                      required
                      onChange={handleChange}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="username">Userame</Label>
                    <Input
                      id="username"
                      name="username"
                      placeholder="Robinson"
                      required
                      onChange={handleChange}
                    />
                  </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    name="email"
                    placeholder="m@example.com"
                    required
                    onChange={handleChange}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    name="password"
                    onChange={handleChange}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    name="confirmPassword"
                    onChange={handleChange}
                  />
                </div>
                <Button type="submit" className="w-full" onClick={handleSubmit}>
                  Create an account
                </Button>
                <Button variant="outline" className="w-full">
                  Sign up with Google
                </Button>
              </div>
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
