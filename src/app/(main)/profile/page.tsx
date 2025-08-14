"use client";
import { trpc } from "@/app/_trpc/client";
import { QueryStateHandler } from "@/components/QueryStateHandler";
import { UserProfileCard } from "@/components/UserProfileCard";
import { useUserStore } from "@/lib/store/user.store";
import React from "react";

const Profile: React.FC = () => {
  const { user } = useUserStore();
  const getUser = trpc.user.getUserProfileInfos.useQuery({
    id: user?.id || "",
  });

  return (
    <QueryStateHandler query={getUser}>
      {getUser.data && (
        <UserProfileCard
          {...getUser.data}
          profilePictureUrl={getUser.data?.profilePictureUrl ?? undefined}
          backgroundPictureUrl={getUser.data?.backgroundPictureUrl ?? undefined}
          canEdit={true}
        />
      )}
    </QueryStateHandler>
  );
};

export default Profile;
