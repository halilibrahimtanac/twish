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
    HoverCardContent,
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
    Share2,
    MoreHorizontal,
    CalendarDays,
  } from "lucide-react";
import { TooltipIconButton } from "../ui/tooltip-icon-button";
import { trpc } from "@/app/_trpc/client";
import { toast } from "sonner";
import { useUserStore } from "@/lib/store/user.store";
  
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
  }
  
  interface TwishCardProps {
    twish: TwishData;
  }
  
  export function TwishCard({ twish }: TwishCardProps) {
    const { user } = useUserStore();
    const utils = trpc.useUtils();
    const likeTwish = trpc.twish.likeTwish.useMutation({
      onSuccess: () => {
        utils.twish.getAllTwishes.invalidate();
      },
      onError: (error) => {
        console.error("Failed to post:", error);
        toast("Error", {
          description: "Something went wrong. Please try again.",
          closeButton: true
        });
      },
    });


    return (
      <Card className="min-w-2xl mx-auto py-2 rounded-sm gap-3">
        <CardHeader className="flex flex-row items-center gap-2 space-y-0 px-3">
          <HoverCard>
            <HoverCardTrigger asChild>
              <a href={`/${twish.authorUsername}`} className="flex-shrink-0">
                <Avatar>
                  {/* <AvatarImage src={twish.authorAvatarUrl} alt={twish.authorName} /> */}
                  <AvatarFallback>
                    {twish.authorName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
              </a>
            </HoverCardTrigger>
            <HoverCardContent>
              <div className="flex justify-between space-x-4">
                <Avatar>
                   {/* <AvatarImage src={twish.authorAvatarUrl} /> */}
                   <AvatarFallback>
                      {twish.authorName.split(" ").map((n) => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold">{twish.authorName}</h4>
                  {/* <p className="text-sm">{twish.authorBio}</p> */}
                  <div className="flex items-center pt-2">
                    <CalendarDays className="mr-2 h-4 w-4 opacity-70" />
                    <span className="text-xs text-muted-foreground">
                      Joined {twish.authorJoinedDate}
                    </span>
                  </div>
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
  
          <div className="flex-grow">
            <div className="flex items-center justify-between">
              <div>
                <a
                  href={`/${twish.authorUsername}`}
                  className="font-semibold text-sm hover:underline"
                >
                  {twish.authorName}
                </a>
                <p className="text-xs text-muted-foreground">
                  @{twish.authorUsername}
                </p>
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                <span>{twish.createdAt}</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="w-8 h-8 ml-2">
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
  
        <Separator />
  
        <CardFooter className="py-0 px-2">
        <TooltipProvider>
          <div className="flex w-full items-center justify-start gap-1 text-muted-foreground">
            {/* Like Button */}
            <TooltipIconButton
              IconComponent={Heart}
              tooltipText="Like"
              hoverClassName="group-hover:text-red-500 group-hover:fill-red-500"
              onClick={() => likeTwish.mutate({ twishId: twish.id, username: user?.username || ""})}
            />
            <span className="min-w-[2.5rem] pr-4 text-sm font-medium">{twish.likes}</span>

            {/* Comment Button */}
            <TooltipIconButton
              IconComponent={MessageCircle}
              tooltipText="Comment"
              hoverClassName="group-hover:text-blue-500"
            />
            <span className="min-w-[2.5rem] pr-4 text-sm font-medium">{twish.comments}</span>

            {/* Share Button (Pushed to the right) */}
            <TooltipIconButton
              IconComponent={Share2}
              tooltipText="Share"
              hoverClassName="group-hover:text-green-500"
              className="ml-auto" // Use the className prop for layout
            />
          </div>
        </TooltipProvider>
      </CardFooter>
      </Card>
    );
  }