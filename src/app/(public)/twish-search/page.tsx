import React from 'react'

interface TwishSearchProps {
    searchParams: { [key: string]: string | string[] | undefined };
  }

const TwishSearch = async ({ searchParams }: TwishSearchProps) => {
  const params = await searchParams;

  return (
    <div>Twish Search: {params.query} - {params.type}</div>
  )
}

export default TwishSearch;