import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CardHeader } from "@/components/ui/card";
import { HoverCard, HoverCardTrigger } from "@/components/ui/hover-card";
import { dateStringConverter } from "@/lib/utils";
import { MoreHorizontal, Trash2, UserPlus, VolumeX } from "lucide-react";
import React from "react";
import { TwishData } from "../TwishCard";
import { useUserStore } from "@/lib/store/user.store";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Props {
  viewAuthorName: string;
  viewAuthorNameInitials: string;
  viewAuthorUserName: string;
  viewCreatedAt: string;
  twish: TwishData;
}

const TwishHeader: React.FC<Props> = ({
  viewAuthorName,
  viewAuthorNameInitials,
  viewAuthorUserName,
  viewCreatedAt,
  twish,
}) => {
  const { user } = useUserStore();
  const avatarUrl =
    twish.type === "retwish"
      ? twish.originalTwish?.authorAvatarUrl
      : twish.authorAvatarUrl;
  const isAuthor = user?.username === viewAuthorUserName;
  const userRoute = isAuthor ? "/profile" : `/user/${viewAuthorUserName}`;

  const handleSelect = (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const handleDelete = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const handleFollow = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <CardHeader className="flex flex-row items-center gap-2 space-y-0 px-3">
      <HoverCard>
        <HoverCardTrigger asChild>
          <Link
            href={userRoute}
            className="flex-shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <Avatar>
              <AvatarImage
                src={avatarUrl || undefined}
                alt={twish.authorName}
              />
              <AvatarFallback>{viewAuthorNameInitials}</AvatarFallback>
            </Avatar>
          </Link>
        </HoverCardTrigger>
      </HoverCard>

      <div className="flex-grow">
        <div className="flex items-center justify-between">
          <div>
            <Link
              href={userRoute}
              className="font-semibold text-sm hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {viewAuthorName}
            </Link>
            <p className="text-xs text-muted-foreground">
              @{viewAuthorUserName}
            </p>
          </div>
          <div className="flex items-center text-xs text-muted-foreground">
            <span>{dateStringConverter(viewCreatedAt)}</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8 ml-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                onClick={(e) => e.stopPropagation()}
              >
                {isAuthor && (
                  <>
                    <DropdownMenuItem
                      onSelect={handleSelect}
                      onClick={handleDelete}
                      className="text-red-500 focus:text-red-500"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      <span>Delete</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                {!isAuthor && (
                  <DropdownMenuItem
                    onSelect={handleSelect}
                    onClick={handleFollow}
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    <span>Follow @{viewAuthorUserName}</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onSelect={handleSelect}>
                  <VolumeX className="mr-2 h-4 w-4" />
                  <span>Mute @{viewAuthorUserName}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </CardHeader>
  );
};

export default TwishHeader;
