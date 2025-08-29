import { trpc } from "@/app/_trpc/client";
import { clsx, type ClassValue } from "clsx";
import { toast } from "sonner";
import { twMerge } from "tailwind-merge";
import { City } from "./city-search";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const dateStringConverter = (dateString: string): string => {
  if(!dateString) return "";

  const d = new Date(dateString);

  const str = d.toLocaleString("en-GB", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return str.replaceAll("/", ".").replace(",", "");
};

export const initials = (str: string | undefined): string => str ? str.trim().split(" ").map((n) => n[0].toUpperCase()).join("") : "";

interface MutationOptionsConfig {
  utils: ReturnType<typeof trpc.useUtils>;
  onSuccessCallback?: () => void;
  errorMessage?: string;
}

export const createMutationOptions = ({
  utils,
  onSuccessCallback,
  errorMessage,
}: MutationOptionsConfig) => ({
  onSuccess: () => {
    utils.twish.invalidate();

    onSuccessCallback?.();
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onError: (error: any) => {
    toast.error("Error", {
      description: error.message || errorMessage || "Something went wrong. Please try again.",
      closeButton: true,
      duration: 3000,
    });
  },
});

export const formatCityName = (city: City | null) => {
  if (!city) return "";
  return `${city.name}, ${city.admin1}, ${city.country}`;
};
