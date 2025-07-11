import React, { useContext, useState } from "react";
import { CardFooter } from "@/components/ui/card";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn, resultFunctions } from "@/lib/utils";
import { Heart, MessageCircle, Repeat } from "lucide-react";
import { TwishData } from "../TwishCard";
import { trpc } from "@/app/_trpc/client";
import { useUserStore } from "@/lib/store/user.store";
import { TooltipIconButton } from "@/components/ui/tooltip-icon-button";
import { RetwishModal } from "../RetwishModal";
import { TwishContext } from "../TwishList";

interface Props {
  twish: TwishData;
}

const TwishFooter: React.FC<Props> = ({ twish }) => {
  const { userId } = useContext(TwishContext);
  const [isRetwishModalOpen, setIsRetwishModalOpen] = useState(false);
  const utils = trpc.useUtils();
  const { user } = useUserStore();

  const likeTwish = trpc.twish.likeTwish.useMutation({
    ...resultFunctions(utils, twish.id, undefined, "Failed to like twish", userId),
  });
  
  const viewLikes = twish.type === "retwish" ? twish.originalLikes : twish.likes;
  const viewRetwishes = twish.type === "retwish" ? twish.originalRetwishes : twish.retwishes;
  const viewLikedByUsers = twish.type === "retwish" ? twish.originalLikedByUserIds : twish.likedByUserIds;
  const viewRetwishedByUsers = twish.type === "retwish" ? twish.originalRetwishedByUserIds : twish.retwishedByUserIds;
    
  return (
    <>
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
                  twishId: (twish.type === "retwish" ? twish.originalTwish?.id : twish.id) as string,
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
              hoverClassName={cn(
                "group-hover:text-green-500",
                viewRetwishedByUsers?.includes(user?.id || "") && "text-green-500"
              )}
              onClick={() => setIsRetwishModalOpen(true)}
            />
            <span className="min-w-fit pr-2 text-sm font-medium">
              {viewRetwishes}
            </span>
          </div>
        </TooltipProvider>
      </CardFooter>

      <RetwishModal 
        twish={twish}
        isOpen={isRetwishModalOpen}
        onOpenChange={setIsRetwishModalOpen}
      />
    </>
  );
};

export default TwishFooter;