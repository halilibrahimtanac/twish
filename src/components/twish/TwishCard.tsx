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
  
  export interface TwishData {
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
    return (
      <Card className="min-w-2xl mx-auto">
        <CardHeader className="flex flex-row items-start gap-4 space-y-0">
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
  
        <CardContent>
          <p className="text-base whitespace-pre-wrap leading-relaxed">
            {twish.content}
          </p>
        </CardContent>
  
        <Separator />
  
        <CardFooter className="py-2">
          <TooltipProvider>
            <div className="flex items-center justify-start gap-1 w-full text-muted-foreground">
              {/* Like Button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="group">
                    <Heart className="h-5 w-5 group-hover:text-red-500 group-hover:fill-red-500 transition-colors" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Like</p>
                </TooltipContent>
              </Tooltip>
              <span className="text-sm font-medium pr-4">{twish.likes}</span>
  
              {/* Comment Button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="group">
                    <MessageCircle className="h-5 w-5 group-hover:text-blue-500 transition-colors" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Comment</p>
                </TooltipContent>
              </Tooltip>
              <span className="text-sm font-medium pr-4">{twish.comments}</span>
              
              {/* Share Button */}
              <div className="ml-auto">
                  <Tooltip>
                  <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="group">
                      <Share2 className="h-5 w-5 group-hover:text-green-500 transition-colors" />
                      </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                      <p>Share</p>
                  </TooltipContent>
                  </Tooltip>
              </div>
            </div>
          </TooltipProvider>
        </CardFooter>
      </Card>
    );
  }