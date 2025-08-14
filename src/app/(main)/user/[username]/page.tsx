"use client";
import { trpc } from "@/app/_trpc/client";
import { UserProfileCard } from "@/components/UserProfileCard";
import { useParams } from "next/navigation";
import React from "react";

const UserPage: React.FC = () => {
  const { username } = useParams();
  const getUser = trpc.user.getUserProfileInfos.useQuery({ id: username?.toString() || "" }, { enabled: !!username });

  if (getUser.isLoading) {
    return <div>Loading...</div>;
  }

  if (getUser.error) {
    return <span className="text-red-500">{getUser.error.message}</span>;
  }

  const userData = {
    ...getUser.data,
    profilePictureUrl: getUser.data?.profilePictureUrl ?? undefined,
    backgroundPictureUrl: getUser.data?.backgroundPictureUrl ?? undefined,
  };

  return <UserProfileCard {...userData} />;
};

export default UserPage;
