import { trpc } from "@/app/_trpc/client";
import { Button } from "../ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";

function FollowButton({ followingId }: { followingId: string }) {
  const { data:sessionData } = useSession();
  const user = sessionData?.user;

  const [isHovering, setIsHovering] = useState(false);

  const utils = trpc.useUtils();

  const toggleFollowMutation = trpc.follows.followRoute.useMutation({
    onSuccess: () => {
      if (user?.id && followingId) {
        utils.follows.getFollowStatus.invalidate({ followerId: user.id, followingId });
      }
      utils.follows.userFollowCounts.invalidate();
    },
  });

  const { data, isLoading } = trpc.follows.getFollowStatus.useQuery(
    { followerId: user?.id ?? "", followingId },
    {
      enabled: !!user?.id && !!followingId && user.id !== followingId,
    }
  );

  if (!user) {
    return (
      <Button
        variant="outline"
        className="w-[120px] rounded-xl bg-gray-100 text-gray-500 cursor-wait"
        disabled
      >
        ...
      </Button>
    );
  }

  if (user.id === followingId) {
    return null;
  }

  if (isLoading || !data) {
    return (
      <Button
        variant="outline"
        className="w-[120px] rounded-xl bg-gray-100 text-gray-500 cursor-wait"
        disabled
      >
        ...
      </Button>
    );
  }

  if (data.isCurrentUser) {
    return null;
  }

  const handleFollowClick = () =>
    toggleFollowMutation.mutateAsync({ followerId: user.id, followingId });

  const isFollowing = data.isFollowing;

  if (isFollowing) {
    return (
      <Button
        variant="outline"
        onClick={handleFollowClick}
        disabled={toggleFollowMutation.isPending}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        className={cn(
          `w-[120px] rounded-md border transition-all duration-300`,
          isHovering
            ? "bg-red-500 !text-red-500 border-red-500 shadow-md scale-105"
            : "text-red-500 border-red-400 hover:bg-red-50"
        )}
      >
        {isHovering ? "Unfollow" : "Following"}
      </Button>
    );
  }

  return (
    <Button
      onClick={handleFollowClick}
      disabled={toggleFollowMutation.isPending}
      className="w-[120px] rounded-md bg-blue-500 text-white hover:bg-blue-600 shadow-sm hover:shadow-md transition-all duration-300 active:scale-95"
    >
      Follow
    </Button>
  );
}

export default FollowButton;