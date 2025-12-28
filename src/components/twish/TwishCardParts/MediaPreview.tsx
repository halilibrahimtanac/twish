import Image from "next/image";
import { useState, useEffect, useCallback } from "react"; // useCallback eklendi
import { MediaPreviewItem } from "../TwishCard";
import { cn } from "@/lib/utils";
import FullScreenMedia from "@/components/FullScreenMedia";

const MediaPreview = ({ mediaItems }: { mediaItems: MediaPreviewItem[] }) => {
  // State'i artık obje yerine index olarak tutuyoruz. null ise kapalı demek.
  const [currentMediaIndex, setCurrentMediaIndex] = useState<number | null>(null);

  const mediaCount = mediaItems.length;

  const openFullscreen = (index: number) => {
    setCurrentMediaIndex(index);
  };

  const closeFullscreen = (e?: React.MouseEvent<HTMLElement>) => {
    e?.stopPropagation();
    setCurrentMediaIndex(null);
  };

 
  const handleNext = useCallback(() => {
    if (currentMediaIndex === null) return;
   
    const nextIndex = (currentMediaIndex + 1) % mediaCount;
    setCurrentMediaIndex(nextIndex);
  }, [currentMediaIndex, mediaCount]);

  const handlePrev = useCallback(() => {
    if (currentMediaIndex === null) return;
    const prevIndex = (currentMediaIndex - 1 + mediaCount) % mediaCount;
    setCurrentMediaIndex(prevIndex);
  }, [currentMediaIndex, mediaCount]);


  // Klavye (ok tuşları ve Esc) ile kontrol
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (currentMediaIndex === null) return;

      if (e.key === "Escape") {
        closeFullscreen();
      }
      if (mediaCount > 1) {
        if (e.key === "ArrowRight") {
          handleNext();
        }
        if (e.key === "ArrowLeft") {
          handlePrev();
        }
      }
    };

    if (currentMediaIndex !== null) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [currentMediaIndex, mediaCount, handleNext, handlePrev]);


  if (!mediaItems || mediaCount === 0) return null;

  // Gösterilecek olan aktif medya
  const fullscreenMedia = currentMediaIndex !== null ? mediaItems[currentMediaIndex] : null;

  return (
    <>
      <div
        className={cn(
          "mt-1 grid gap-0.5 overflow-hidden rounded-lg border",
          mediaCount === 1 ? "grid-cols-1" : "grid-cols-2",
          mediaCount === 3 ? "grid-rows-2" : "grid-rows-1",
          mediaCount >= 4 ? "grid-rows-2" : ""
        )}
      >
        {mediaItems.slice(0, 4).map((item, index) => {
          const itemClasses = mediaCount === 3 && index === 0 ? "row-span-2" : "";

          const mediaElement =
            item.mimeType.startsWith("image/") ? (
              <Image
                src={item.url}
                alt={item.originalName}
                fill
                priority
                className="h-full w-full object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            ) : (
              <video
                controls={false}
                muted
                loop
                playsInline
                className="h-full w-full object-cover"
                preload="metadata"
              >
                <source src={`${item.url}#t=0.1`} type={item.mimeType} />
                Your browser does not support the video tag.
              </video>
            );

          return (
            <div
              key={item.id}
              className={cn(
                "relative w-full cursor-pointer bg-muted transition-opacity hover:opacity-90",
                mediaCount > 1 ? "aspect-square" : "aspect-video",
                itemClasses
              )}
              onClick={(e) => {
                e.stopPropagation();
                openFullscreen(index); // Artık index gönderiyoruz
              }}
            >
              {mediaElement}
            </div>
          );
        })}
      </div>

      {/* Fullscreen Modal */}
      {fullscreenMedia && (
        <FullScreenMedia fullscreenMedia={fullscreenMedia} closeFullscreen={closeFullscreen} mediaCount={mediaCount} handleNext={handleNext} handlePrev={handlePrev} />
      )}
    </>
  );
};

export default MediaPreview;