import { TooltipProvider } from "@radix-ui/react-tooltip";
import { TwishCard } from "./TwishCard";
import { trpc } from "@/app/_trpc/client";

export default function TwishList() {
    const twishes = trpc.twish.getAllTwishes.useQuery();

    if(twishes.isLoading){
        return <div>Loading...</div>
    }

    if(twishes.isError){
        return <div>Error: {twishes.error.message}</div>
    }
    
    return (
      <TooltipProvider> 
        <main className="min-h-screen bg-background flex flex-col items-center p-4">
          <div className="flex flex-col gap-4">
            {twishes.data && twishes.data.length > 0 ? (
              twishes.data.map(twish => {
                // const postCardData = transformPostData(post);
                return <TwishCard key={twish.id} twish={twish} />;
              })
            ) : (
              <p className="text-muted-foreground">No posts yet. Be the first!</p>
            )}
          </div>
        </main>
      </TooltipProvider>
    );
  }