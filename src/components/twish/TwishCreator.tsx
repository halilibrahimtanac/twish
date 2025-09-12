/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useRef } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { cn, initials } from "@/lib/utils";
import { toast } from "sonner";
import { trpc } from "@/app/_trpc/client";
import { AvatarImage } from "@radix-ui/react-avatar";
import { Textarea } from "../ui/textarea";
import { ImageIcon, Video, X, Play } from "lucide-react";
import { useSocket } from "../SocketContext";
import { useSession } from "next-auth/react";

interface MediaFile {
  file: File;
  preview: string;
  type: "image" | "video";
}

export const renderHighlightedText = (text: string) => {
  const hashtagRegex = /(#\w+)/g;
  const parts = text.split(hashtagRegex);

  return parts.map((part, index) =>
    hashtagRegex.test(part) ? (
      <span key={index} className="text-blue-500">
        {part}
      </span>
    ) : (
      part)
  );
};

export function TwishCreator() {
  const { data } = useSession();
  const user = data?.user;
  const { socket } = useSocket();
  const [content, setContent] = useState("");
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [playingVideos, setPlayingVideos] = useState<Set<number>>(new Set());

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const videoRefs = useRef<{ [key: number]: HTMLVideoElement | null }>({});
  const backdropRef = useRef<HTMLDivElement>(null);

  const utils = trpc.useUtils();
  const { mutateAsync: twishMutate, isPending } =
    trpc.twish.newTwish.useMutation({
      onError: (error) => {
        console.error("Failed to post:", error);
        toast("Error", {
          description: "Something went wrong. Please try again.",
          closeButton: true,
        });
      },
    });

  const { mutateAsync: twishUpdate, isPending: isUpdatePending } =
    trpc.twish.updateTwishMediaPreview.useMutation({
      onError: (error) => {
        console.error("Failed to post:", error);
        toast("Error", {
          description: "Medias couldn't be uploaded.",
          closeButton: true,
        });
      },
    });

  const { mutateAsync: deleteTwish } = trpc.twish.deleteTwish.useMutation({
    onError: (error) => {
      console.error(
        "CRITICAL: Failed to rollback (delete) orphaned twish:",
        error
      );
      toast("Critical Error", {
        description:
          "Failed to clean up an incomplete post. Please contact support.",
        closeButton: true,
      });
    },
  });

  const MAX_CHARACTERS = 280;
  const MAX_MEDIA_FILES = 4;
  const charactersRemaining = MAX_CHARACTERS - content.length;


  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remainingSlots = MAX_MEDIA_FILES - mediaFiles.length;
    const filesToAdd = files.slice(0, remainingSlots);

    const newMediaFiles: MediaFile[] = filesToAdd.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      type: "image",
    }));

    setMediaFiles((prev) => [...prev, ...newMediaFiles]);

    if (e.target) e.target.value = "";
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remainingSlots = MAX_MEDIA_FILES - mediaFiles.length;
    const filesToAdd = files.slice(0, remainingSlots);

    const newMediaFiles: MediaFile[] = filesToAdd.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      type: "video",
    }));

    setMediaFiles((prev) => [...prev, ...newMediaFiles]);

    if (e.target) e.target.value = "";
  };

  const removeMediaFile = (index: number) => {
    setMediaFiles((prev) => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });

    delete videoRefs.current[index];
    setPlayingVideos((prev) => {
      const newSet = new Set(prev);
      newSet.delete(index);
      return newSet;
    });
  };

  const handlePlayButtonClick = async (index: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const video = videoRefs.current[index];
    if (!video) return;
    try {
      await video.play();
      setPlayingVideos((prev) => new Set(prev).add(index));
    } catch (error) {
      console.error("Error playing video:", error);
    }
  };

  const handleVideoPlay = (index: number) => {
    setPlayingVideos((prev) => new Set(prev).add(index));
  };
  const handleVideoPause = (index: number) => {
    setPlayingVideos((prev) => {
      const newSet = new Set(prev);
      newSet.delete(index);
      return newSet;
    });
  };

  const uploadMediaFiles = async (twishId: string, files: MediaFile[]) => {
    if (files.length === 0) return [];
    const formData = new FormData();
    files.forEach((media) => formData.append("files", media.file));
    const response = await fetch(`/api/upload-media?twishId=${twishId}`, {
      method: "POST",
      body: formData,
    });
    if (!response.ok) {
      const res = await response.json();
      throw new Error(res.message);
    }
    return (await response.json()).files;
  };

  const handlePost = async () => {
    if (content.length === 0 || content.length > MAX_CHARACTERS) return;

    let newTwishId: string | null = null;
    try {
      const newTwish = await twishMutate({
        content,
        hasMedia: mediaFiles.length > 0,
        mediaCount: mediaFiles.length,
      });

      newTwishId = newTwish.id;

      if (mediaFiles.length > 0 && newTwishId) {
        const uploadedFiles = await uploadMediaFiles(newTwishId, mediaFiles);
        await twishUpdate({
          id: newTwishId,
          mediaPreview: JSON.stringify(uploadedFiles),
        });
      }

      toast("Success", {
        description: "Your post has been published.",
        closeButton: true,
      });
      utils.twish.getAllTwishes.invalidate();
      socket?.emit("new-twish-posted", newTwishId);

      mediaFiles.forEach((media) => URL.revokeObjectURL(media.preview));
      setMediaFiles([]);
      setContent("");
      setPlayingVideos(new Set());
      videoRefs.current = {};
    } catch (error: any) {
      if (newTwishId) {
        toast("Rolling back...", {
          description: error.message,
          closeButton: true,
        });
        await deleteTwish({ id: newTwishId });
      } else {
        toast("Error", {
          description: error.message,
          closeButton: true,
        });
      }
    }
  };

  const userInitial = initials(user?.name);

  const sharedTextareaClasses = "min-h-[80px] w-full rounded-md border-input bg-transparent px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none whitespace-pre-wrap break-word";

  return (
    <Card className="w-full max-w-2xl mx-auto gap-4 py-2 rounded-none">
      <input
        type="file"
        ref={imageInputRef}
        onChange={handleImageSelect}
        accept="image/*"
        multiple
        className="hidden"
      />
      <input
        type="file"
        ref={videoInputRef}
        onChange={handleVideoSelect}
        accept="video/*"
        multiple
        className="hidden"
      />

      <CardContent className="px-2">
        <div className="grid gap-2">
          <div className="max-w-2xl flex items-start space-x-2">
            <Avatar className="h-12 w-12">
              <AvatarImage
                src={user?.profilePictureUrl ?? undefined}
                alt={user?.name}
              />
              <AvatarFallback>{userInitial}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 grid">
              <div
                ref={backdropRef}
                className={cn(
                  sharedTextareaClasses,
                  "text-lg pointer-events-none text-foreground [grid-area:1/1/2/2]"
                )}
                aria-hidden="true"
              >
                {renderHighlightedText(content + "\n")}
              </div>

              <Textarea
                rows={2}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's happening?"
                className={cn(
                  sharedTextareaClasses,
                  "!text-lg text-transparent caret-foreground bg-transparent border-none shadow-none focus-visible:ring-0 [grid-area:1/1/2/2]",
                  "select-none"
                )}
                onScroll={(e) => {
                  if (backdropRef.current) {
                    backdropRef.current.scrollTop = e.currentTarget.scrollTop;
                  }
                }}
              />
            </div>
          </div>

          {mediaFiles.length > 0 && (
            <div className="ml-14 mt-3">
              <div
                className={cn(
                  "grid gap-2 rounded-2xl overflow-hidden border",
                  mediaFiles.length === 1 ? "grid-cols-1" :
                  mediaFiles.length === 2 ? "grid-cols-2" :
                  mediaFiles.length === 3 ? "grid-cols-2" : "grid-cols-2"
                )}
              >
                {mediaFiles.map((media, index) => (
                  <div
                    key={index}
                    className={cn(
                      "relative group overflow-hidden bg-muted",
                      mediaFiles.length === 3 && index === 0 && "row-span-2",
                      mediaFiles.length === 1 ? "aspect-video" : "aspect-square"
                    )}
                  >
                    {media.type === "image" ? (
                      <img
                        src={media.preview}
                        alt="Media preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="relative w-full h-full">
                        <video
                          ref={(el) => { videoRefs.current[index] = el; }}
                          src={media.preview}
                          className="w-full h-full object-cover"
                          controls={playingVideos.has(index)}
                          muted loop playsInline
                          onLoadedData={(e) => { e.currentTarget.currentTime = 0.1; }}
                          onPlay={() => handleVideoPlay(index)}
                          onPause={() => handleVideoPause(index)}
                          onEnded={() => handleVideoPause(index)}
                        />
                        {!playingVideos.has(index) && (
                          <button
                            onClick={(e) => handlePlayButtonClick(index, e)}
                            className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors cursor-pointer z-10"
                          >
                            <div className="bg-black/60 rounded-full p-3 hover:bg-black/80 transition-colors">
                              <Play className="h-8 w-8 text-white fill-white ml-1" />
                            </div>
                          </button>
                        )}
                      </div>
                    )}
                    <Button
                      variant="destructive" size="icon"
                      className="absolute top-2 right-2 h-8 w-8 rounded-full opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-20 shadow-lg"
                      onClick={() => removeMediaFile(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex justify-between items-center border-t px-4 [.border-t]:pt-2">
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost" size="icon"
            onClick={() => imageInputRef.current?.click()}
            disabled={mediaFiles.length >= MAX_MEDIA_FILES || isPending}
            className="h-9 w-9 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
          >
            <ImageIcon className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost" size="icon"
            onClick={() => videoInputRef.current?.click()}
            disabled={mediaFiles.length >= MAX_MEDIA_FILES || isPending}
            className="h-9 w-9 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
          >
            <Video className="h-5 w-5" />
          </Button>
          {mediaFiles.length > 0 && (
            <span className="text-sm text-muted-foreground">
              {mediaFiles.length}/{MAX_MEDIA_FILES}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <p className={cn(
            "text-sm",
            charactersRemaining < 20 ? "text-yellow-500" : "text-muted-foreground",
            charactersRemaining < 0 ? "text-red-500 font-bold" : ""
          )}>
            {charactersRemaining}
          </p>
          <Button
            onClick={handlePost}
            disabled={ content.length === 0 || content.length > MAX_CHARACTERS || isPending || isUpdatePending }
          >
            {(isPending || isUpdatePending) ? "Posting..." : "Post"}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}