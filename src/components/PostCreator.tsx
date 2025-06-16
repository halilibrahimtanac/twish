"use client";

import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardFooter,
  // CardHeader,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useUserStore } from "@/lib/store/user.store";
import { trpc } from "@/app/_trpc/client";

export function PostCreator() {
  const { user } = useUserStore();
  const [content, setContent] = useState("");
  const { mutateAsync: twishMutate, isPending } =
    trpc.twish.newTwish.useMutation({
      onSuccess: (res) => {
        console.log("RES: ", res);
        toast("Success", {
          description: "Your post has been published.",
          closeButton: true
        });
      },
      onError: (error) => {
        console.error("Failed to post:", error);
        toast("Error", {
          description: "Something went wrong. Please try again.",
          closeButton: true
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

  const userInitial =
    user?.name
      .split(" ")
      .map((u) => u[0])
      .join("") || "U";

  return (
    <Card className="w-full max-w-2xl mx-auto gap-4 py-4">
      {/* <CardHeader>
     
      </CardHeader> */}
      <CardContent>
        <div className="grid w-full gap-2">
          <div className="flex items-start space-x-2">
            <Avatar className="h-12 w-12">
              {/* <AvatarImage src={user.avatarUrl} alt={user.name} /> */}
              <AvatarFallback>{userInitial}</AvatarFallback>
            </Avatar>
            <div className="w-full">
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's happening?"
                className="w-full min-h-[100px] resize-none border-0 shadow-none focus-visible:ring-0"
              />
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between items-center border-t p-4">
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
