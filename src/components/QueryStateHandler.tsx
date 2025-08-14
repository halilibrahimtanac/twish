import React, { PropsWithChildren } from "react";
import { TRPCClientErrorLike } from "@trpc/client";
import { Spinner } from "./ui/Spinner";
import { ErrorMessage } from "./ui/ErrorMessage";
import { AppRouter } from "@/server";

type QueryStateProps<TData> = PropsWithChildren<{
  query: {
    data: TData | undefined;
    isLoading: boolean;
    isError: boolean;
    error: TRPCClientErrorLike<AppRouter> | null;
  };
}>;

export const QueryStateHandler = <TData,>({
  query,
  children,
}: QueryStateProps<TData>) => {
  const { isLoading, isError, error, data } = query;

  if (isLoading) {
    return <div className="w-full flex justify-center items-center"><Spinner /></div>;
  }

  if (isError) {
    return <ErrorMessage message={error?.message || "Bilinmeyen bir hata oluştu."} />;
  }

  if (data) {
    return <>{children}</>;
  }

  return null;
};