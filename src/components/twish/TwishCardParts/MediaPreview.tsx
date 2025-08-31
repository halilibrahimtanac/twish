import Image from "next/image";
import { useState, useEffect, useCallback } from "react"; // useCallback eklendi
import { X, ChevronLeft, ChevronRight } from "lucide-react"; // Navigasyon ikonları eklendi
import { MediaPreviewItem } from "../TwishCard";
import { cn } from "@/lib/utils";

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
          "mt-3 grid gap-0.5 overflow-hidden rounded-lg border",
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 p-4"
          onClick={closeFullscreen}
        >
          {/* Close Button */}
          <button
            onClick={closeFullscreen}
            className="absolute right-4 top-4 z-[51] rounded-full bg-black bg-opacity-30 p-2 text-white transition-all hover:bg-opacity-50"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Navigasyon: Geri Butonu */}
          {mediaCount > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              className="absolute left-4 top-1/2 z-[51] -translate-y-1/2 rounded-full bg-black bg-opacity-30 p-2 text-white transition-all hover:bg-opacity-50"
            >
              <ChevronLeft className="h-7 w-7" />
            </button>
          )}

          {/* Navigasyon: İleri Butonu */}
          {mediaCount > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="absolute right-4 top-1/2 z-[51] -translate-y-1/2 rounded-full bg-black bg-opacity-30 p-2 text-white transition-all hover:bg-opacity-50"
            >
              <ChevronRight className="h-7 w-7" />
            </button>
          )}

          {/* Media Content */}
          <div
            className="relative flex h-full w-full items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {fullscreenMedia.mimeType.startsWith("image/") ? (
              <Image
                src={fullscreenMedia.url}
                alt={fullscreenMedia.originalName}
                width={1920}
                height={1080}
                className="block h-auto max-h-[95vh] w-auto max-w-[95vw] object-contain"
              />
            ) : (
              <video
                controls
                autoPlay
                className="max-h-[95vh] max-w-[95vw] object-contain"
              >
                <source
                  src={fullscreenMedia.url}
                  type={fullscreenMedia.mimeType}
                />
                Your browser does not support the video tag.
              </video>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default MediaPreview;