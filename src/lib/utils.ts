import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

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

export const initials = (str: string |undefined): string => str ? str.split(" ").map((n) => n[0].toUpperCase()).join("") : "";
