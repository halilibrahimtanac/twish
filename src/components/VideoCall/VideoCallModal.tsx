'use client';

import { useEffect, useRef } from 'react';
import { PhoneOff } from 'lucide-react';
import { useWebRTC } from '../WebRTCContext';
import { Button } from '../ui/button';

export const VideoCallModal = ({ targetUserId }: { targetUserId: string }) => {
  const { localStream, remoteStream, endCall } = useWebRTC();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center p-4">
      <div className="relative w-full h-full max-w-4xl max-h-[80vh] grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Remote Video */}
        <div className="w-full h-full bg-black rounded-lg overflow-hidden">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        </div>

        {/* Local Video */}
        <div className="absolute w-48 h-32 bottom-5 right-5 md:relative md:w-full md:h-full md:bottom-0 md:right-0 bg-gray-800 rounded-lg overflow-hidden border-2 border-gray-600">
           <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        </div>
      </div>
      <div className="mt-4">
         <Button variant="destructive" size="lg" onClick={() => endCall(targetUserId)}>
            <PhoneOff className="mr-2 h-5 w-5"/> End Call
         </Button>
      </div>
    </div>
  );
};