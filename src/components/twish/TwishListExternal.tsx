/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react'
import { QueryStateHandler } from '../QueryStateHandler'
import { TooltipProvider } from '../ui/tooltip'
import { TwishCard, TwishData } from './TwishCard'

interface TwishListExternalProps {
  twishes: any;
  emptyMessage?: React.ReactNode;
}

const TwishListExternal = ({ twishes, emptyMessage }: TwishListExternalProps) => {
  return (
    <QueryStateHandler query={twishes}>
        <TooltipProvider>
          <main className="sm:w-auto w-full min-h-screen bg-background flex flex-col items-center">
            <div className="w-full flex flex-col">
              {twishes.data && twishes.data.length > 0 ? (
                twishes.data.map((twish: TwishData) => (
                  <TwishCard key={twish.id} twish={twish} />
                ))
              ) : (
                emptyMessage || <p className="text-muted-foreground mt-4">
                  No posts yet. Be the first!
                </p>
              )}
            </div>
          </main>
        </TooltipProvider>
    </QueryStateHandler>
  )
}

export default TwishListExternal