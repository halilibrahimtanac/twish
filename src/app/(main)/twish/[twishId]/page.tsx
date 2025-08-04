"use client";
import { trpc } from "@/app/_trpc/client";
import { TwishCard } from "@/components/twish/TwishCard";
import { useParams } from "next/navigation";
import React from "react";

const Page = () => {
  const { twishId } = useParams();
  const { data, isError, error, isFetching } = trpc.twish.getSingleTwish.useQuery({ twishId: twishId?.toString() || "" });

  if (isFetching) {
    return <div>Loading...</div>;
  }

  if (isError) {
    return <span className="text-red-500">{error.message}</span>;
  }

  if (data) {
    return (
      <div className="sm:w-auto w-full flex flex-col mx-auto items-center box-border p-3">
        <TwishCard twish={data} />
      </div>
    );
  }

  return <div>No twish found.</div>;
};

export default Page;
