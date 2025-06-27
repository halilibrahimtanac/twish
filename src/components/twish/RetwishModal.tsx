import React, { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TwishData } from "./TwishCard";
import { trpc } from "@/app/_trpc/client";
import { useUserStore } from "@/lib/store/user.store";



interface RetwishModalProps {
  twish: TwishData;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

// You can move this helper to a shared utils file if you use it elsewhere
const resultFunctions = (
  utils: ReturnType<typeof trpc.useUtils>,
  onSuccessCallback: () => void,
  errorMessage: string = ""
) => ({
  onSuccess: () => {
    utils.twish.getAllTwishes.invalidate();
    onSuccessCallback(); // To close the modal
  },
  onError: () => {
    toast("Error", {
      description: errorMessage || "Something went wrong. Please try again.",
      closeButton: true,
    });
  },
});

export const RetwishModal: React.FC<RetwishModalProps> = ({
  twish,
  isOpen,
  onOpenChange,
}) => {
  const [quoteContent, setQuoteContent] = useState("");
  const { user } = useUserStore();
  const utils = trpc.useUtils();

  const reTwish = trpc.twish.reTwish.useMutation(
    resultFunctions(
      utils,
      () => onOpenChange(false), // Close modal on success
      "Failed to post."
    )
  );

  const handleRetwish = () => {
    if (!user) return toast.error("You must be logged in to retwish.");

    reTwish.mutate({
      content: "",
      userId: user.id,
      originalTwishId: twish.originalTwish?.id || twish.id,
      type: "retwish"
    });
  };

  const handleQuoteTwish = () => {
    if (!user) return toast.error("You must be logged in to quote.");
    if (!quoteContent.trim()) return;

    reTwish.mutate({
      content: quoteContent,
      userId: user.id,
      originalTwishId: twish.originalTwish?.id || twish.id,
      type: "quote"
    });
  };
  
  const embeddedTwish = twish.originalTwish?.authorName ? twish.originalTwish : twish;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Amplify this Twish</DialogTitle>
        </DialogHeader>

        {/* Modal Middle Part */}
        <div className="flex flex-col gap-4 py-4">
          <div className="flex gap-4">
            <Avatar>
              <AvatarImage src={user?.profilePictureUrl ?? undefined} />
              <AvatarFallback>{user?.username?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <Textarea
              placeholder="Add a comment..."
              className="min-h-[80px] resize-none border-none focus-visible:ring-0"
              value={quoteContent}
              onChange={(e) => setQuoteContent(e.target.value)}
            />
          </div>

          {/* Embedded Twish to be quoted/retwished */}
          <div className="ml-2 rounded-xl border p-4">
            <div className="mb-2 flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={embeddedTwish.authorAvatarUrl ?? undefined} />
                <AvatarFallback>{embeddedTwish.authorName?.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="font-bold">{embeddedTwish.authorName}</span>
              <span className="text-sm text-muted-foreground">@{embeddedTwish.authorUsername}</span>
            </div>
            <p className="text-muted-foreground">{embeddedTwish.content}</p>
          </div>
        </div>

        {/* Modal Footer Buttons */}
        <DialogFooter className="gap-2 sm:justify-between">
           <DialogClose asChild>
            <Button type="button" variant="outline" className="w-full sm:w-auto">
              Cancel
            </Button>
          </DialogClose>
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
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
                onClick={handleQuoteTwish}
                disabled={!quoteContent.trim() || reTwish.isPending}
            >
                Quote
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};