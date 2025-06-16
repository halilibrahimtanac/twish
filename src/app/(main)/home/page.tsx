"use client"
import { PostCreator } from '@/components/PostCreator'
import React from 'react'

const Home = () => {
  return (
    <div className='w-full flex justify-center box-border p-3'>
      <PostCreator />
    </div>
  )
}

export default Home