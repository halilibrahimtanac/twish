import {
  Avatar,
  AvatarFallback,
  // AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  HoverCard,
  // HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  MessageCircle,
  Heart,
  MoreHorizontal,
  // CalendarDays,
  Repeat,
} from "lucide-react";
import { TooltipIconButton } from "../ui/tooltip-icon-button";
import { trpc } from "@/app/_trpc/client";
import { toast } from "sonner";
import { useUserStore } from "@/lib/store/user.store";
import { cn, dateStringConverter, initials } from "@/lib/utils";

export interface TwishData {
  id: string;
  authorName: string;
  authorUsername: string;
  authorAvatarUrl?: string;
  content: string;
  createdAt: string; // Using a string for simplicity, you could use Date
  likes?: number;
  comments?: number;
  authorBio?: string;
  authorJoinedDate: string;
  likedByUserIds?: string[];
  retwishes: number;
  retwishedByUserIds: string[];
  originalTwish?: {
    id: string;
    content: string;
    createdAt: string;
    authorId: string;
    authorName: string;
    authorUsername: string;
    authorAvatarId?: string;
  };
  originalLikes: number;
  originalLikedByUserIds?: string[];
  originalRetwishes: number;
  originalRetwishedByUserIds?: string[];
}

interface TwishCardProps {
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

export function TwishCard({ twish }: TwishCardProps) {
  const { user } = useUserStore();
  const utils = trpc.useUtils();
  const likeTwish = trpc.twish.likeTwish.useMutation({
    ...resultFunctions(utils, "Failed to like twish"),
  });
  const reTwish = trpc.twish.reTwish.useMutation({
    ...resultFunctions(utils, "Failed to retwish"),
  });


  const viewAuthorName = twish.originalTwish?.authorName || twish.authorName;
  const viewAuthorUserName = twish.originalTwish?.authorUsername || twish.authorUsername;
  const viewCreatedAt = twish.originalTwish?.createdAt || twish.createdAt;
  const viewAuthorNameInitials = initials(viewAuthorName);

  const viewLikes = twish.originalTwish?.authorUsername ? twish.originalLikes : twish.likes;
  const viewRetwishes = twish.originalTwish?.authorUsername ? twish.originalRetwishes : twish.retwishes;
  const viewLikedByUsers = twish.originalTwish?.authorUsername ? twish.originalLikedByUserIds : twish.likedByUserIds;
  const viewRetwishedByUsers = twish.originalTwish?.authorUsername ? twish.originalRetwishedByUserIds : twish.retwishedByUserIds;


  return (
    <Card className="min-w-2xl mx-auto py-2 rounded-none gap-3 border-t-0">
      {twish.originalTwish?.authorUsername && <p className="ml-4 flex items-center gap-2 text-xs font-bold"> <Repeat className="w-4 h-4"/> {twish.authorName} retwished</p>}
      <CardHeader className="flex flex-row items-center gap-2 space-y-0 px-3">
        
         <HoverCard>
          <HoverCardTrigger asChild>
            <a href={`/${viewAuthorName}`} className="flex-shrink-0">
              <Avatar>
                {/* <AvatarImage src={twish.authorAvatarUrl} alt={twish.authorName} />  */}
                <AvatarFallback>
                  {viewAuthorNameInitials}
                </AvatarFallback>
              </Avatar>
            </a>
          </HoverCardTrigger>
         {/*  <HoverCardContent>
            <div className="flex justify-start space-x-4">
              <Avatar>
                <AvatarImage src={twish.authorAvatarUrl} />
                <AvatarFallback>
                  {viewAuthorNameInitials}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <h4 className="text-sm font-semibold">{viewAuthorName}</h4>
                <p className="text-sm">{twish.authorBio}</p> 
                <div className="flex items-center pt-2">
                  <CalendarDays className="mr-2 h-4 w-4 opacity-70" />
                  <span className="text-xs text-muted-foreground">
                    Joined {twish.authorJoinedDate}
                  </span>
                </div>
              </div>
            </div>
          </HoverCardContent> */}
        </HoverCard> 
      
        

        <div className="flex-grow">
          <div className="flex items-center justify-between">
            <div>
              <a
                href={`/${viewAuthorName}`}
                className="font-semibold text-sm hover:underline"
              >
                {viewAuthorName}
              </a>
              <p className="text-xs text-muted-foreground">
                @{viewAuthorUserName}
              </p>
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <span>{dateStringConverter(viewCreatedAt)}</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-8 h-8 ml-2"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>More options</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-4">
        <p className="text-base whitespace-pre-wrap leading-relaxed">
          {twish.content}
        </p>
      </CardContent>

      <Separator className="!h-[0.5px]" />

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
    </Card>
  );
}