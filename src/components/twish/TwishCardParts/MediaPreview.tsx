import Image from "next/image";
import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { MediaPreviewItem } from "../TwishCard";

const MediaPreview = ({ mediaItems }: { mediaItems: MediaPreviewItem[] }) => {
  const [fullscreenMedia, setFullscreenMedia] = useState<MediaPreviewItem | null>(null);

  // ESC tuşu ile kapatma
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setFullscreenMedia(null);
      }
    };

    if (fullscreenMedia) {
      document.addEventListener('keydown', handleEsc);
      // Body scroll'unu engelle
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [fullscreenMedia]);

  if (!mediaItems || mediaItems.length === 0) return null;

  const openFullscreen = (item: MediaPreviewItem) => {
    setFullscreenMedia(item);
  };

  const closeFullscreen = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setFullscreenMedia(null);
  };

  return (
    <>
      <div className="mt-3 rounded-lg overflow-hidden border">
        {mediaItems.map((item) => {
          if (item.type === "image") {
            return (
              <div 
                key={item.id} 
                className="relative w-full h-auto max-h-96 cursor-pointer hover:opacity-90 transition-opacity"
                onClick={(e) => {
                    e.stopPropagation();
                    openFullscreen(item)
                }}
              >
                <Image
                  src={item.url}
                  alt={item.originalName}
                  width={800}
                  height={400}
                  priority
                  className="w-full h-auto max-h-96 object-cover"
                  style={{
                    maxWidth: '100%',
                    height: 'auto',
                  }}
                />
              </div>
            );
          } else if (item.type === "video" || item.mimeType.startsWith('video/')) {
            return (
              <div 
                key={item.id} 
                className="relative w-full h-auto max-h-96"
              >
                <video
                  controls
                  className="w-full h-auto max-h-96 object-cover"
                  preload="metadata"
                >
                  <source src={item.url} type={item.mimeType} />
                  Your browser does not support the video tag.
                </video>
              </div>
            );
          }
          return null;
        })}
      </div>

      {/* Fullscreen Modal */}
      {fullscreenMedia && (
        <div 
          className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4"
          onClick={closeFullscreen}
        >
          {/* Close Button */}
          <button
            onClick={closeFullscreen}
            className="absolute top-4 right-4 z-60 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full p-2 transition-all"
          >
            <X className="w-6 h-6 text-black" />
          </button>

          {/* Media Content */}
          <div 
            className="relative max-w-full max-h-full"
            onClick={(e) => e.stopPropagation()}
          >
            {fullscreenMedia.type === "image" ? (
              <Image
                src={fullscreenMedia.url}
                alt={fullscreenMedia.originalName}
                width={1200}
                height={800}
                className="max-w-full max-h-full object-contain"
                style={{
                  maxWidth: '95vw',
                  maxHeight: '95vh',
                }}
              />
            ) : (
              <video
                controls
                autoPlay
                className="max-w-full max-h-full object-contain"
                style={{
                  maxWidth: '95vw',
                  maxHeight: '95vh',
                }}
              >
                <source src={fullscreenMedia.url} type={fullscreenMedia.mimeType} />
                Your browser does not support the video tag.
              </video>
            )}
          </div>

          {/* Media Info */}
          <div className="absolute bottom-4 left-4 text-white bg-black bg-opacity-50 rounded px-3 py-2">
            <p className="text-sm font-medium">{fullscreenMedia.originalName}</p>
            <p className="text-xs opacity-75">
              {(fullscreenMedia.size / 1024).toFixed(1)} KB • {fullscreenMedia.mimeType}
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default MediaPreview;