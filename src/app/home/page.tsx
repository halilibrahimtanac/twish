"use client"
import React from 'react'
import { trpc } from '../_trpc/client'

const Home = () => {
  const getUsers = trpc.user.getUsers.useQuery();

  if(getUsers.isLoading){
    return <div>loading...</div>
  }

  if(getUsers.isError){
    return <div>{getUsers.error.message}</div>
  }
  return (
    <div>{JSON.stringify(getUsers.data)}</div>
  )
}

export default Home