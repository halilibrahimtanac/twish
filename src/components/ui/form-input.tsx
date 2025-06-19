"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import React from "react";
import { FieldErrors, FieldValues, Path, UseFormRegister } from "react-hook-form";

// We use generics here to make the component strongly typed
interface FormInputProps<T extends FieldValues> extends React.ComponentProps<"input"> {
  name: Path<T>;
  label: string;
  register: UseFormRegister<T>;
  errors: FieldErrors<T>;
  className?: string;
  containerClassName?: string;
  type: string;
}

export function FormInput<T extends FieldValues>({
  name,
  label,
  register,
  errors,
  type = "text",
  className,
  containerClassName,
  ...props
}: FormInputProps<T>) {
  const error = errors[name];

  return (
    <div className={cn("grid gap-2", containerClassName)}>
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        type={type}
        {...register(name)}
        {...props}
        className={cn(error && "border-red-500", className)}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error.message?.toString()}</p>
      )}
    </div>
  );
}