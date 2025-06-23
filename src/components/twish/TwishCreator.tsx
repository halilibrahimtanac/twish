"use client";
import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  // CardHeader,
} from "@/components/ui/card";
import { cn, initials } from "@/lib/utils";
import { toast } from "sonner";
import { useUserStore } from "@/lib/store/user.store";
import { trpc } from "@/app/_trpc/client";
import { AvatarImage } from "@radix-ui/react-avatar";
import { Textarea } from "../ui/textarea";

export function TwishCreator() {
  const { user } = useUserStore();
  const [content, setContent] = useState("");
  const utils = trpc.useUtils();
  const { mutateAsync: twishMutate, isPending } =
    trpc.twish.newTwish.useMutation({
      onSuccess: () => {
        utils.twish.getAllTwishes.invalidate();
        toast("Success", {
          description: "Your post has been published.",
          closeButton: true,
        });
      },
      onError: (error) => {
        console.error("Failed to post:", error);
        toast("Error", {
          description: "Something went wrong. Please try again.",
          closeButton: true,
        });
      },
    });

  const MAX_CHARACTERS = 280;
  const charactersRemaining = MAX_CHARACTERS - content.length;

  const handlePost = async () => {
    if (content.length === 0 || content.length > MAX_CHARACTERS) {
      return;
    }

    await twishMutate({ content, username: user?.username || "" });
    setContent("");
  };

  const userInitial = initials(user?.name);

  return (
    <Card className="w-full max-w-2xl mx-auto gap-4 py-2 rounded-none">
      <CardContent className="px-2">
        <div className="grid gap-2">
          <div className="max-w-2xl flex items-start space-x-2 whitespace-pre-wrap">
            <Avatar className="h-12 w-12">
              <AvatarImage src={user?.profilePictureUrl ?? undefined} alt={user?.name} />
              <AvatarFallback>{userInitial}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <Textarea
                rows={2}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's happening?"
                className="w-full relative resize-none border-none box-border pl-0 pr-4 shadow-none focus-visible:ring-0 whitespace-pre-wrap break-word"
              />
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex justify-between items-center border-t px-4 [.border-t]:pt-2">
        {/* Optional: Add icons for image upload, etc. here */}
        <div className="flex items-center space-x-2">
          {/* You can add action icons here in the future */}
        </div>

        <div className="flex items-center space-x-4">
          <p
            className={cn(
              "text-sm",
              charactersRemaining < 20
                ? "text-yellow-500"
                : "text-muted-foreground",
              charactersRemaining < 0 ? "text-red-500 font-bold" : ""
            )}
          >
            {charactersRemaining}
          </p>
          <Button
            onClick={handlePost}
            disabled={
              content.length === 0 ||
              content.length > MAX_CHARACTERS ||
              isPending
            }
          >
            {isPending ? "Posting..." : "Post"}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
