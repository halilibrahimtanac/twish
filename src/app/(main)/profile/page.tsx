"use client"
import { UserProfileCard } from '@/components/UserProfileCard';
import { useUserStore } from '@/lib/store/user.store'
import React from 'react'

const Profile: React.FC = () => {
  const { user } = useUserStore();
  return (
    <UserProfileCard {...user}/>
  )
}

export default Profile