"use client";
import { trpc } from "@/app/_trpc/client";
import { QueryStateHandler } from "@/components/QueryStateHandler"; // Yeni import
import { UserProfileCard } from "@/components/profile/UserProfileCard";
import { useParams } from "next/navigation";
import React from "react";

const UserPage: React.FC = () => {
  const { username } = useParams();
  const userProfileQuery = trpc.user.getUserProfileInfos.useQuery(
    { id: username?.toString() || "" },
    { enabled: !!username }
  );

  return (
    <QueryStateHandler query={userProfileQuery}>
      <UserProfileCard
        {...userProfileQuery.data}
        profilePictureUrl={userProfileQuery.data?.profilePictureUrl ?? undefined}
        backgroundPictureUrl={userProfileQuery.data?.backgroundPictureUrl ?? undefined}
      />
    </QueryStateHandler>
  );
};

export default UserPage;