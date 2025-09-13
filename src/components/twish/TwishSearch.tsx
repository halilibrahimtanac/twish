"use client"
import { trpc } from '@/app/_trpc/client';
import React from 'react'
import TwishListExternal from './TwishListExternal';

interface PropTypes {
    query: string;
    type: "tag" | "word";
}

const TwishSearch: React.FC<PropTypes> = ({ query, type }) => {
  const twishes = trpc.search.searchTwish.useQuery({ query, type });

  return (
    <TwishListExternal twishes={twishes}/>
  )
}

export default TwishSearch