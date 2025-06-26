import { TooltipProvider } from "@radix-ui/react-tooltip";
import { TwishCard } from "./TwishCard";
import { trpc } from "@/app/_trpc/client";

export default function TwishList({ userIdParam }: { userIdParam?: string }) {
    const twishes = trpc.twish.getAllTwishes.useQuery({ userId: userIdParam });

    if(twishes.isLoading){
        return <div>Loading...</div>
    }

    if(twishes.isError){
        return <div>Error: {twishes.error.message}</div>
    }
    
    return (
      <TooltipProvider> 
        <main className="sm:w-auto w-full min-h-screen bg-background flex flex-col items-center">
          <div className="w-full flex flex-col">
            {twishes.data && twishes.data.length > 0 ? (
              twishes.data.map(twish => <TwishCard key={twish.id} twish={twish} />)
            ) : (
              <p className="text-muted-foreground mt-4">No posts yet. Be the first!</p>
            )}
          </div>
        </main>
      </TooltipProvider>
    );
  }