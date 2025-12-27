/* eslint-disable @typescript-eslint/no-unused-vars */
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CardHeader } from "@/components/ui/card";
import { HoverCard, HoverCardTrigger } from "@/components/ui/hover-card";
import { dateStringConverter } from "@/lib/utils";
import { MoreHorizontal, Trash2, UserPlus, VolumeX } from "lucide-react";
import React from "react";
import { TwishData } from "../TwishCard";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { trpc } from "@/app/_trpc/client";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

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
  const { data:sessionData } = useSession();
  const user = sessionData?.user;
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.follows.getFollowStatus.useQuery(
    { followingId: twish.authorUsername, type: "name" },
    { enabled: user?.username !== twish.authorUsername }
  );

  const toggleFollowMutation = trpc.follows.followRoute.useMutation({
    onSuccess: () => {
      utils.follows.getFollowStatus.invalidate();
    },
  });
  const { mutate: deleteTwish } = trpc.twish.deleteTwish.useMutation({
    onSuccess: () => {
      utils.twish.invalidate();
      toast.success("Twish deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete twish");
    },
  });
  const avatarUrl =
    twish.type === "retwish"
      ? twish.originalTwish?.authorAvatarUrl
      : twish.authorAvatarUrl;
  const isAuthor = user?.username === viewAuthorUserName;
  const userRoute = isAuthor ? "/profile" : `/user/${viewAuthorUserName}`;
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);

  const handleSelect = (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const handleDeleteOpen = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDeleteDialogOpen(true);
  };
  const handleDelete = () => {
    deleteTwish({ id: twish.id });
    setIsDeleteDialogOpen(false);
  };
  const handleFollow = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFollowMutation.mutateAsync({ followingId: twish.authorUsername, type: "name" });
  };

  return (
    <>
      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => setIsDeleteDialogOpen(open)}
        title="Delete twish?"
        description="This action cannot be undone. Your twish will be permanently removed."
        confirmLabel="Delete"
        confirmVariant="destructive"
        onConfirm={handleDelete}
        contentProps={{ onClick: (e) => e.stopPropagation() }}
      />
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
                        onClick={handleDeleteOpen}
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
                      <span>{data?.isFollowing ? "Unfollow" : "Follow"} @{viewAuthorUserName}</span>
                    </DropdownMenuItem>
                  )}
                  {!isAuthor &&<DropdownMenuItem onSelect={handleSelect}>
                    <VolumeX className="mr-2 h-4 w-4" />
                    <span>Mute @{viewAuthorUserName}</span>
                  </DropdownMenuItem>}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </CardHeader>
    </>
  );
};

export default TwishHeader;
