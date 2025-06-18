"use client"
import { TwishCreator } from '@/components/twish/TwishCreator'
import TwishList from '@/components/twish/TwishList'
import React from 'react'

const Home = () => {
  return (
    <div className='w-full flex flex-col items-center box-border p-3'>
      <TwishCreator />

      <TwishList />
    </div>
  )
}

export default Home