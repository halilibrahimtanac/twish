"use client"
import { trpc } from '@/app/_trpc/client';
import { UserProfileCard } from '@/components/UserProfileCard';
import { useUserStore } from '@/lib/store/user.store'
import React from 'react'

const Profile: React.FC = () => {
  const { user } = useUserStore();
  const getUser = trpc.user.getUserProfileInfos.useQuery({ id: user?.id || "" });

  if(getUser.isLoading){
    return <div>Loading...</div>
  }

  if(getUser.error){
    return <span className='text-red-500'>{getUser.error.message}</span>
  }

  const userData = {
    ...getUser.data,
    profilePictureUrl: getUser.data?.profilePictureUrl ?? undefined,
    backgroundPictureUrl: getUser.data?.backgroundPictureUrl ?? undefined,
  };

  return (
    <UserProfileCard {...userData} />
  )
}

export default Profile