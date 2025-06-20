import React from 'react'
import { TwishData } from '../TwishCard'
import { CardFooter } from '@/components/ui/card';
import { TooltipProvider } from '@/components/ui/tooltip';
import { TooltipIconButton } from '@/components/ui/tooltip-icon-button';
import { Heart, MessageCircle, Repeat } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserStore } from '@/lib/store/user.store';
import { trpc } from '@/app/_trpc/client';
import { toast } from 'sonner';

interface Props {
    twish: TwishData;

}

const resultFunctions = (
  utils: ReturnType<typeof trpc.useUtils>,
  errorMessage: string = ""
) => ({
  onSuccess: () => {
    utils.twish.getAllTwishes.invalidate();
  },
  onError: () => {
    toast("Error", {
      description: errorMessage || "Something went wrong. Please try again.",
      closeButton: true,
    });
  },
});

const TwishFooter: React.FC<Props> = ({ twish }) => {
  const utils = trpc.useUtils();
  const likeTwish = trpc.twish.likeTwish.useMutation({
    ...resultFunctions(utils, "Failed to like twish"),
  });
  const reTwish = trpc.twish.reTwish.useMutation({
    ...resultFunctions(utils, "Failed to retwish"),
  });
  const { user } = useUserStore();
  const viewLikes = twish.originalTwish?.authorUsername ? twish.originalLikes : twish.likes;
  const viewRetwishes = twish.originalTwish?.authorUsername ? twish.originalRetwishes : twish.retwishes;
  const viewLikedByUsers = twish.originalTwish?.authorUsername ? twish.originalLikedByUserIds : twish.likedByUserIds;
  const viewRetwishedByUsers = twish.originalTwish?.authorUsername ? twish.originalRetwishedByUserIds : twish.retwishedByUserIds;
    
  return (
    <CardFooter className="py-0 px-2">
        <TooltipProvider>
          <div className="flex w-full items-center justify-start gap-1 text-muted-foreground">
            {/* Like Button */}
            <TooltipIconButton
              IconComponent={Heart}
              tooltipText="Like"
              hoverClassName={cn(
                "group-hover:text-red-500 group-hover:fill-red-500",
                viewLikedByUsers?.includes(user?.id || "") &&
                  "text-red-500 fill-red-500"
              )}
              onClick={() =>
                likeTwish.mutate({
                  twishId: twish.originalTwish?.id || twish.id,
                  username: user?.username || "",
                })
              }
            />
            <span className="min-w-fit pr-2 text-sm font-medium">
              {viewLikes}
            </span>

            {/* Comment Button */}
            <TooltipIconButton
              IconComponent={MessageCircle}
              tooltipText="Comment"
              hoverClassName="group-hover:text-blue-500"
            />
            <span className="min-w-fit pr-2 text-sm font-medium">
              {twish.comments}
            </span>

            {/* Share Button */}
            <TooltipIconButton
              IconComponent={Repeat}
              tooltipText="Retwish"
              hoverClassName={cn("group-hover:text-green-500", viewRetwishedByUsers?.includes(user?.id || "") &&
                "text-green-500")}
              onClick={() =>
                reTwish.mutate({
                  content: twish.content,
                  userId: user?.id || "",
                  originalTwishId: twish.originalTwish?.id || twish.id,
                })
              }
            />

            <span className="min-w-fit pr-2 text-sm font-medium">
              {viewRetwishes}
            </span>
          </div>
        </TooltipProvider>
      </CardFooter>
  )
}

export default TwishFooter