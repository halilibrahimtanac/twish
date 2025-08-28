import React, { useState, useRef } from "react";
import { toast } from "sonner";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter, 
  DialogClose 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TwishData } from "./TwishCard";
import { trpc } from "@/app/_trpc/client";
import { useUserStore } from "@/lib/store/user.store";
import EmbeddedTwish from "./EmbeddedTwish";
import { createMutationOptions, cn } from "@/lib/utils";
import { Image, Video, X, Play } from "lucide-react";

interface MediaFile {
  file: File;
  preview: string;
  type: "image" | "video";
}

interface RetwishModalProps {
  twish: TwishData;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isComment: boolean;
}

export const RetwishModal: React.FC<RetwishModalProps> = ({ 
  twish, 
  isOpen, 
  onOpenChange, 
  isComment 
}) => {
  const [quoteContent, setQuoteContent] = useState("");
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [playingVideos, setPlayingVideos] = useState<Set<number>>(new Set());

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const videoRefs = useRef<{ [key: number]: HTMLVideoElement | null }>({});

  const { user } = useUserStore();
  const utils = trpc.useUtils();

  const MAX_CHARACTERS = 280;
  const MAX_MEDIA_FILES = 4;
  const charactersRemaining = MAX_CHARACTERS - quoteContent.length;

  const reTwish = trpc.twish.reTwish.useMutation(
    createMutationOptions({
      utils,
      onSuccessCallback: () => {
        onOpenChange(false);
        // Clean up media files
        mediaFiles.forEach((media) => URL.revokeObjectURL(media.preview));
        setMediaFiles([]);
        setQuoteContent("");
        setPlayingVideos(new Set());
        videoRefs.current = {};
      },
      errorMessage: "Failed to post.",
    })
  );

  const twishUpdate = trpc.twish.updateTwishMediaPreview.useMutation({
    onSuccess: () => {
      utils.twish.getAllTwishes.invalidate();
    },
    onError: (error) => {
      console.error("Failed to upload media:", error);
      toast("Error", {
        description: "Medias couldn't be uploaded.",
        closeButton: true,
      });
    },
  });

  // Media handling functions
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

    if (e.target) {
      e.target.value = "";
    }
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

    if (e.target) {
      e.target.value = "";
    }
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

  const handlePlayButtonClick = async (
    index: number, 
    e: React.MouseEvent
  ) => {
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
    files.forEach((media) => {
      formData.append("files", media.file);
    });

    const response = await fetch(`/api/upload-media?twishId=${twishId}`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("File upload failed");
    }

    const data = await response.json();
    return data.files;
  };

  const handleRetwish = () => {
    if (!user) return toast.error("You must be logged in to retwish.");

    reTwish.mutate({
      content: "",
      userId: user.id,
      originalTwishId: (
        twish.type === "retwish" ? twish.originalTwish?.id : twish.id
      ) as string,
      type: "retwish",
      hasMedia: false,
      mediaCount: 0
    });
  };

  const handleQuoteOrCommentTwish = async (type: "quote" | "comment") => {
    if (!user) return toast.error("You must be logged in to quote.");
    if (!quoteContent.trim()) return;

    try {
      const twishId = (
        twish.type === "retwish" ? twish.originalTwish?.id : twish.id
      ) as string;

      const newTwish = await reTwish.mutateAsync({
        content: quoteContent,
        userId: user.id,
        originalTwishId: 
          twish.type === "comment" ? 
            twish.originalTwish?.id as string : twishId,
        type: type,
        parentTwishId: twish.type === "comment" ? twishId : undefined,
        hasMedia: mediaFiles.length > 0,
        mediaCount: mediaFiles.length,
      });

      // Upload media files if any
      if (mediaFiles.length > 0 && newTwish.id) {
        const uploadedFiles = await uploadMediaFiles(newTwish.id, mediaFiles);
        
        await twishUpdate.mutateAsync({
          id: newTwish.id,
          mediaPreview: JSON.stringify(uploadedFiles)
        });
      }
    } catch (error) {
      console.error("Error creating twish:", error);
      toast("Error", {
        description: "Failed to create post. Please try again.",
        closeButton: true,
      });
    }
  };

  const embeddedTwish = (
    twish.type === "retwish" ? twish.originalTwish : twish
  ) as TwishData;

  const commentInputArea = (
    <>
      {/* Hidden file inputs */}
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

      <div className="flex gap-4">
        <Avatar>
          <AvatarImage src={user?.profilePictureUrl ?? undefined} />
          <AvatarFallback>
            {user?.username?.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <Textarea
            placeholder={isComment ? "Post your reply" : "Add a comment..."}
            className="min-h-[80px] resize-none border-none focus-visible:ring-0"
            value={quoteContent}
            onChange={(e) => setQuoteContent(e.target.value)}
          />

          {/* Media Preview */}
          {mediaFiles.length > 0 && (
            <div className="mt-3">
              <div
                className={cn(
                  "grid gap-2 rounded-2xl overflow-hidden border",
                  mediaFiles.length === 1
                    ? "grid-cols-1"
                    : mediaFiles.length === 2
                    ? "grid-cols-2"
                    : mediaFiles.length === 3
                    ? "grid-cols-2"
                    : "grid-cols-2"
                )}
              >
                {mediaFiles.map((media, index) => (
                  <div
                    key={index}
                    className={cn(
                      "relative group overflow-hidden bg-muted",
                      mediaFiles.length === 3 && index === 0
                        ? "row-span-2"
                        : "",
                      mediaFiles.length === 1 
                        ? "aspect-video" 
                        : "aspect-square"
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
                          ref={(el) => {
                            videoRefs.current[index] = el;
                          }}
                          src={media.preview}
                          className="w-full h-full object-cover"
                          controls={playingVideos.has(index)}
                          muted
                          loop
                          playsInline
                          onLoadedData={(e) => {
                            e.currentTarget.currentTime = 0.1;
                          }}
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
                      variant="destructive"
                      size="icon"
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

          {/* Media Controls and Character Counter */}
          <div className="flex justify-between items-center mt-3">
            <div className="flex items-center space-x-2">
              {/* Image upload button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => imageInputRef.current?.click()}
                disabled={
                  mediaFiles.length >= MAX_MEDIA_FILES || 
                  reTwish.isPending ||
                  twishUpdate.isPending
                }
                className="h-9 w-9 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
              >
                <Image className="h-5 w-5" />
              </Button>

              {/* Video upload button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => videoInputRef.current?.click()}
                disabled={
                  mediaFiles.length >= MAX_MEDIA_FILES || 
                  reTwish.isPending ||
                  twishUpdate.isPending
                }
                className="h-9 w-9 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
              >
                <Video className="h-5 w-5" />
              </Button>

              {/* Media counter */}
              {mediaFiles.length > 0 && (
                <span className="text-sm text-muted-foreground">
                  {mediaFiles.length}/{MAX_MEDIA_FILES}
                </span>
              )}
            </div>

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
          </div>
        </div>
      </div>
    </>
  );

  const embeddedContent = (
    <EmbeddedTwish
      embeddedTwish={{
        id: embeddedTwish.id,
        authorAvatarUrl: embeddedTwish.authorAvatarUrl,
        authorName: embeddedTwish.authorName,
        authorUsername: embeddedTwish.authorUsername,
        content: embeddedTwish.content,
        createdAt: embeddedTwish.createdAt,
      }}
    />
  );

  // Clean up on modal close
  const handleModalClose = (open: boolean) => {
    if (!open) {
      mediaFiles.forEach((media) => URL.revokeObjectURL(media.preview));
      setMediaFiles([]);
      setQuoteContent("");
      setPlayingVideos(new Set());
      videoRefs.current = {};
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleModalClose}>
      <DialogContent className="sm:max-w-[525px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Amplify this Twish</DialogTitle>
        </DialogHeader>

        <div 
          className="flex flex-col gap-4 py-4" 
          onClick={(e) => e.stopPropagation()}
        >
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

        <DialogFooter 
          className="gap-2 sm:justify-between" 
          onClick={(e) => e.stopPropagation()}
        >
          <DialogClose asChild>
            <Button 
              type="button" 
              variant="outline" 
              className="w-full sm:w-auto"
            >
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
                  disabled={reTwish.isPending || twishUpdate.isPending}
                >
                  Retwish
                </Button>
                <Button
                  type="submit"
                  className="w-full sm:w-auto"
                  onClick={() => handleQuoteOrCommentTwish("quote")}
                  disabled={
                    !quoteContent.trim() || 
                    charactersRemaining < 0 ||
                    reTwish.isPending ||
                    twishUpdate.isPending
                  }
                >
                  {(reTwish.isPending || twishUpdate.isPending) 
                    ? "Posting..." 
                    : "Quote"
                  }
                </Button>
              </>
            )}
            {isComment && (
              <Button
                type="submit"
                className="w-full sm:w-auto"
                onClick={() => handleQuoteOrCommentTwish("comment")}
                disabled={
                  !quoteContent.trim() || 
                  charactersRemaining < 0 ||
                  reTwish.isPending ||
                  twishUpdate.isPending
                }
              >
                {(reTwish.isPending || twishUpdate.isPending) 
                  ? "Posting..." 
                  : "Comment"
                }
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};