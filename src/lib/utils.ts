import { trpc } from "@/app/_trpc/client";
import { clsx, type ClassValue } from "clsx";
import { toast } from "sonner";
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

export const initials = (str: string | undefined): string => str ? str.trim().split(" ").map((n) => n[0].toUpperCase()).join("") : "";


export const resultFunctions = (
  utils: ReturnType<typeof trpc.useUtils>,
  twishId: string,
  onSuccessCallback?: () => void,
  errorMessage: string = "",
  userIdParam?: string
) => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSuccess: async (data: any) => {
    if(data){
      utils.twish.getAllTwishes.setData({ userId: userIdParam }, (old) => [data, ...(old ?? [])])
    }else {
      const updatedTwish = await utils.twish.getSingleTwish.fetch({ twishId });
      utils.twish.getAllTwishes.setData({ userId: userIdParam }, (old) => old?.map(t => t.id === updatedTwish.id ? updatedTwish : t));
    }
    onSuccessCallback?.();
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onError: (error: any) => {
    toast("Error", {
      description: error.message || errorMessage || "Something went wrong. Please try again.",
      closeButton: true,
    });
  },
});
