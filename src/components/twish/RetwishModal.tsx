import React, { useContext, useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TwishData } from "./TwishCard";
import { trpc } from "@/app/_trpc/client";
import { useUserStore } from "@/lib/store/user.store";
import EmbeddedTwish from "./EmbeddedTwish";
import { resultFunctions } from "@/lib/utils";
import { TwishContext } from "./TwishList";

interface RetwishModalProps {
  twish: TwishData;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isComment: boolean;
}

export const RetwishModal: React.FC<RetwishModalProps> = ({ twish, isOpen, onOpenChange, isComment }) => {
  const { userId } = useContext(TwishContext);
  const [quoteContent, setQuoteContent] = useState("");
  const { user } = useUserStore();
  const utils = trpc.useUtils();

  const reTwish = trpc.twish.reTwish.useMutation(
    resultFunctions(
      utils,
      twish.id,
      () => onOpenChange(false), // Close modal on success
      "Failed to post.",
      userId
    )
  );

  const handleRetwish = () => {
    if (!user) return toast.error("You must be logged in to retwish.");

    reTwish.mutate({
      content: "",
      userId: user.id,
      originalTwishId: (twish.type === "retwish" ? twish.originalTwish?.id : twish.id) as string,
      type: "retwish",
    });
  };

  const handleQuoteOrCommentTwish = (type: "quote" | "comment") => {
    if (!user) return toast.error("You must be logged in to quote.");
    if (!quoteContent.trim()) return;

    reTwish.mutate({
      content: quoteContent,
      userId: user.id,
      originalTwishId: (twish.type === "retwish" ? twish.originalTwish?.id : twish.id) as string,
      type: type,
    });
  };

  const embeddedTwish = (twish.type === "retwish" ? twish.originalTwish : twish) as TwishData;

  const commentInputArea = (
    <div className="flex gap-4">
      <Avatar>
        <AvatarImage src={user?.profilePictureUrl ?? undefined} />
        <AvatarFallback>{user?.username?.charAt(0).toUpperCase()}</AvatarFallback>
      </Avatar>
      <Textarea
        placeholder={isComment ? "Post your reply" : "Add a comment..."}
        className="min-h-[80px] resize-none border-none focus-visible:ring-0"
        value={quoteContent}
        onChange={(e) => setQuoteContent(e.target.value)}
      />
    </div>
  );

  const embeddedContent = (
    <EmbeddedTwish
      embeddedTwish={{
        authorAvatarUrl: embeddedTwish.authorAvatarUrl,
        authorName: embeddedTwish.authorName,
        authorUsername: embeddedTwish.authorUsername,
        content: embeddedTwish.content,
        createdAt: embeddedTwish.createdAt,
      }}
    />
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Amplify this Twish</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          {isComment ? (
            <>
              {embeddedContent}
              {commentInputArea}
            </>
          ) : (
            <>
              {commentInputArea}
              {embeddedContent}
            </>
          )}
        </div>

        {/* Modal Footer Buttons */}
        <DialogFooter className="gap-2 sm:justify-between">
          <DialogClose asChild>
            <Button type="button" variant="outline" className="w-full sm:w-auto">
              Cancel
            </Button>
          </DialogClose>
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            {!isComment && (
              <>
                <Button
                  variant="secondary"
                  className="w-full sm:w-auto"
                  onClick={handleRetwish}
                  disabled={reTwish.isPending}
                >
                  Retwish
                </Button>
                <Button
                  type="submit"
                  className="w-full sm:w-auto"
                  onClick={() => handleQuoteOrCommentTwish("quote")}
                  disabled={!quoteContent.trim() || reTwish.isPending}
                >
                  Quote
                </Button>
              </>
            )}
            {isComment && (
              <Button
                type="submit"
                className="w-full sm:w-auto"
                onClick={() => handleQuoteOrCommentTwish("comment")}
                disabled={!quoteContent.trim() || reTwish.isPending}
              >
                Comment
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};