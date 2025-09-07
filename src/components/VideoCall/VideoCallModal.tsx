'use client';

import { useEffect, useRef, useState } from 'react';
import { PhoneOff, User } from 'lucide-react';
import { useWebRTC } from '../WebRTCContext';
import { Button } from '../ui/button';
import { useUserStore } from '@/lib/store/user.store';
import { trpc } from '@/app/_trpc/client';

const formatTime = (totalSeconds: number) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const paddedMinutes = String(minutes).padStart(2, '0');
  const paddedSeconds = String(seconds).padStart(2, '0');

  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${paddedMinutes}:${paddedSeconds}`;
  }
  return `${paddedMinutes}:${paddedSeconds}`;
};


export const VideoCallModal = () => {
  const { user } = useUserStore();
  const utils = trpc.useUtils();
  const [username, setUsername] = useState("");
  const { localStream, remoteStream, endCall, answeredCallUserId, callingUserInfo } = useWebRTC();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  
  const [elapsedTime, setElapsedTime] = useState(0);

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
  
  useEffect(() => {
    const timerInterval = setInterval(() => {
      setElapsedTime(prevTime => prevTime + 1);
    }, 1000);

    if(!callingUserInfo?.username && answeredCallUserId){
      utils.user.getUserProfileInfos.fetch({ id: answeredCallUserId, field: "username" })
      .then((res) => {
        setUsername(res.username);
      })
    }

    return () => {
      clearInterval(timerInterval);
    };
  }, []);

  const remoteUserName = callingUserInfo?.username || username;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center p-4">
      <div className="relative w-full h-full max-w-4xl max-h-[80vh] grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Remote Video */}
        <div className="relative w-full h-full bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          {!remoteStream && (
            <div className="absolute text-white/70 flex flex-col items-center">
                <User className="h-16 w-16 mb-2" />
                <p>Connecting to {remoteUserName}...</p>
            </div>
          )}
          <div className="absolute bottom-2 left-2 bg-black/50 text-white px-3 py-1 rounded-lg text-sm">
            {remoteUserName}
          </div>
        </div>

        <div className="absolute w-48 h-32 bottom-5 right-5 md:relative md:w-full md:h-full md:bottom-0 md:right-0 bg-gray-800 rounded-lg overflow-hidden border-2 border-gray-600">
           <div className="relative w-full h-full">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-2 left-2 bg-black/50 text-white px-3 py-1 rounded-lg text-sm">
              {user?.username || 'You'} (You)
            </div>
           </div>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-6">
        <div className="text-white text-lg font-mono bg-white/10 px-4 py-2 rounded-lg">
          {formatTime(elapsedTime)}
        </div>

        <Button 
          variant="destructive" 
          size="lg" 
          onClick={() => endCall(answeredCallUserId || "")}
          className="rounded-full w-16 h-16"
        >
            <PhoneOff className="h-6 w-6"/>
            <span className="sr-only">End Call</span>
         </Button>
      </div>
    </div>
  );
};