import { trpc } from "@/app/_trpc/client";
import { Button } from "./ui/button";
import { useUserStore } from "@/lib/store/user.store";
import { useState } from "react";

function FollowButton({ followingId }: { followingId: string }) {
    const { user } = useUserStore();
    const utils = trpc.useUtils();
    const [isHovering, setIsHovering] = useState(false);
  
    const { data, isLoading } = trpc.follows.getFollowStatus.useQuery(
      { followerId: user?.id || "", followingId },
      { enabled: !!followingId && user?.id !== followingId }
    );
  

    const toggleFollowMutation = trpc.follows.followRoute.useMutation({
      onSuccess: (res) => {
        console.log("res: ", res);
        utils.follows.getFollowStatus.invalidate();
      },
    });
  
    if (isLoading || !data) {
      return <Button variant="outline" className="w-[110px]" disabled>...</Button>;
    }
  
    if (data.isCurrentUser) {
      return null;
    }
  
    const handleFollowClick = () => toggleFollowMutation.mutateAsync({ followerId: user?.id || "", followingId });
  
    const isFollowing = data.isFollowing;
  
    if (isFollowing) {
      return (
        <Button
          variant="outline"
          onClick={handleFollowClick}
          disabled={toggleFollowMutation.isPending}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          className="w-[110px] text-red-500 border-red-400 hover:bg-red-50 hover:text-red-600"
        >
          {isHovering ? "Unfollow" : "Following"}
        </Button>
      );
    }
  
    return (
      <Button
        onClick={handleFollowClick}
        disabled={toggleFollowMutation.isPending}
        className="w-[110px]"
      >
        Follow
      </Button>
    );
}

export default FollowButton;