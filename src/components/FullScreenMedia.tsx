import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import Image from 'next/image';
import React from 'react'

interface FullScreenMediaProps {
    fullscreenMedia: {
        url: string;
        originalName: string;
        mimeType: string;
    }
    closeFullscreen: () => void;
    mediaCount: number;
    handleNext?: () => void;
    handlePrev?: () => void;
}

const FullScreenMedia: React.FC<FullScreenMediaProps> = ({ fullscreenMedia, closeFullscreen, mediaCount, handleNext, handlePrev }) => {
  return (
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
                handlePrev?.();
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
                handleNext?.();
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
  )
}

export default FullScreenMedia