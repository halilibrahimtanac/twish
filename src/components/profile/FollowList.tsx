import { trpc } from '@/app/_trpc/client';
import React from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from '../ui/dialog';
import { QueryStateHandler } from '../QueryStateHandler';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { Button } from '../ui/button';
import { useUserStore } from '@/lib/store/user.store';

type FollowUser = {
    id: string | null;
    name: string | null;
    username: string | null;
    profilePictureUrl: string | null;
    isFollowing?: unknown;
}

interface FollowListProps {
    id: string;
    type: "follower" | "following";
    isOpen: boolean;
    onOpenChange: (val: boolean) => void
}

const FollowList: React.FC<FollowListProps> = ({ id, type, isOpen, onOpenChange }) => {
  const { user } = useUserStore(); 
  const utils = trpc.useUtils();
  const getFollowerOrFollowingList = trpc.follows.getFollowerOrFollowingList.useQuery(
    { id, type, userId: user?.id || "" },
    { enabled: isOpen }
  );
  const toggleFollowMutation = trpc.follows.followRoute.useMutation({
    onSuccess: () => {
      utils.follows.getFollowerOrFollowingList.invalidate();
      utils.follows.userFollowCounts.invalidate();
    },
  });

  const handleFollowClick = (id: string) =>
    toggleFollowMutation.mutateAsync({ followerId: user?.id || "", followingId: id });

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {type === "follower" ? "Followers" : "Followings"}
          </DialogTitle>
        </DialogHeader>

        <QueryStateHandler query={getFollowerOrFollowingList}>
          <>
            {getFollowerOrFollowingList?.data?.length === 0 ? (
              <div className="flex h-32 items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  {type === "follower"
                    ? "Henüz takipçi yok."
                    : "Kimse takip edilmiyor."}
                </p>
              </div>
            ) : (
              <ScrollArea className="max-h-[60vh] pr-4">
                <div className="flex flex-col gap-1">
                  {getFollowerOrFollowingList?.data?.map(
                    (user: FollowUser) =>
                      user &&
                      user.username && (
                        <div
                          key={user.username}
                          className="flex items-center justify-between p-2 rounded-lg hover:bg-accent"
                        >
                          <div className="flex items-center gap-4">
                            <Link href={`/${user.username}`}>
                              <Avatar>
                                <AvatarImage
                                  src={user.profilePictureUrl ?? undefined}
                                  alt={user.name ?? user.username}
                                />
                                <AvatarFallback>
                                  {user.name?.substring(0, 2).toUpperCase() ??
                                    user.username.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            </Link>

                            <div>
                              <Link
                                href={`/user/${user.username}`}
                                className="font-semibold leading-none hover:underline"
                              >
                                {user.name ?? user.username}
                              </Link>
                              <p className="text-sm text-muted-foreground">
                                @{user.username}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant={
                              user.isFollowing
                                ? "destructive-outline"
                                : "outline"
                            }
                            size="sm"
                            className="w-24"
                            onClick={() => handleFollowClick(user?.id || "")}
                          >
                            {user.isFollowing ? "Unfollow" : "Follow"}
                          </Button>
                        </div>
                      )
                  )}
                </div>
              </ScrollArea>
            )}
          </>
        </QueryStateHandler>
      </DialogContent>
    </Dialog>
  );
}

export default FollowList;