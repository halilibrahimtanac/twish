/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import Peer from 'simple-peer';
import { useSocket } from './SocketContext';
import { useUserStore } from '@/lib/store/user.store';
import { trpc } from '@/app/_trpc/client';

export type CallUserType = {
    id: string;
    email: string;
    name: string;
    bio: string | null;
    username: string;
    profilePictureUrl: string | null;
    backgroundPictureUrl: string | null;
}

export type CallingUserInfoType = { [x: string]: string; } | CallUserType | null;

interface IWebRTCContext {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isCallActive: boolean;
  isGettingMedia: boolean;
  isCalling: boolean;
  incomingCall: { from: string; signal: any; foundUser: CallUserType } | null;
  answeredCallUserId: string | null;
  callingUserInfo: CallingUserInfoType;
  isUserBusy: string;
  startCall: (targetUserId: string) => void;
  answerCall: () => void;
  rejectCall: () => void;
  endCall: (targetUserId: string) => void;
  cancelCall: (targetUserId: string) => void;
}

const WebRTCContext = createContext<IWebRTCContext | null>(null);

export const useWebRTC = () => {
  const context = useContext(WebRTCContext);
  if (!context) {
    throw new Error('useWebRTC must be used within a WebRTCProvider');
  }
  return context;
};

export const WebRTCProvider = ({ children }: { children: React.ReactNode }) => {
  const { socket } = useSocket();
  const { user } = useUserStore();

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [incomingCall, setIncomingCall] = useState<any>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isGettingMedia, setIsGettingMedia] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [answeredCallUserId, setAnsweredCallUserId] = useState<string | null>(null);
  const [callingUserInfo, setCallingUserInfo] = useState<CallingUserInfoType>(null);
  const [isUserBusy, setIsUserBusy] = useState("");
  const peerRef = useRef<Peer.Instance | null>(null);

  const utils = trpc.useUtils();

  useEffect(() => {
    if (!socket) return;

    socket.on('incoming-call', async ({ from, signal }) => {
      const foundUser = await utils.user.getUserProfileInfos.fetch({ id: from });

      setIncomingCall({ from, signal, foundUser });
      setIsCalling(false);
    });

    socket.on('call-accepted', ({ signal }) => {
      peerRef.current?.signal(signal);
      setIsCallActive(true);
      setIsCalling(false);
    });
    
    socket.on('call-ended', () => {
      cleanUp();
      setIsCalling(false);
    });

    socket.on('call-rejected', () => {
        cleanUp();
        setIsCalling(false);
    });

    socket.on("call-cancelled", () => {
      cleanUp();
      setIsCalling(false);
      setIncomingCall(null);
    })

    socket.on("user-is-busy", () => {
      setIsUserBusy("This user is in another call right now...");
      setTimeout(() => {
        cleanUp();
        setIsCalling(false);
        setIsUserBusy("");
      }, 2000)
    })

    return () => {
      socket.off('incoming-call');
      socket.off('call-accepted');
      socket.off('call-ended');
      socket.off('call-rejected');
      socket.off("call-cancelled");
    };
  }, [socket]);
  
  const cleanUp = () => {
    if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
    }
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    setRemoteStream(null);
    setIsCallActive(false);
    setIncomingCall(null);
    setAnsweredCallUserId(null);
    setCallingUserInfo(null);
  };
  
  const startCall = async (targetUserId: string) => {
    if (!socket || !user?.id || isGettingMedia) return;

    setIsGettingMedia(true);
    setIsCalling(true);
    const foundUser = await utils.user.getUserProfileInfos.fetch({ id: targetUserId });
    setCallingUserInfo(foundUser);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);

      const peer = new Peer({
        initiator: true,
        trickle: false,
        stream: stream,
      });
      peerRef.current = peer;

      peer.on('signal', (signal) => {
        socket.emit('call-user', { targetUserId, signal, fromUserId: user.id });
      });

      peer.on('stream', (stream) => {
        setRemoteStream(stream);
      });

      peer.on('close', () => {
        cleanUp();
        setIsCalling(false);
      });
      
      peer.on('error', () => {
        cleanUp();
        setIsCalling(false);
      });

    } catch (err) {
      console.error("Failed to get media stream:", err);
      cleanUp();
      setIsCalling(false);
    } finally {
        setIsGettingMedia(false);
    }
  };
  
  const answerCall = async () => {
    if (!socket || !incomingCall || isGettingMedia) return;

    setIsGettingMedia(true);
  
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      setIsCallActive(true);

      const peer = new Peer({
        initiator: false,
        trickle: false,
        stream: stream,
      });
      peerRef.current = peer;

      peer.on('signal', (signal) => {
        socket.emit('accept-call', { targetUserId: incomingCall.from, signal });
      });

      peer.on('stream', (stream) => {
        setRemoteStream(stream);
      });
      
      peer.signal(incomingCall.signal);

      setAnsweredCallUserId(incomingCall.from);
      setIncomingCall(null);
      
      peer.on('close', cleanUp);
      peer.on('error', (err) => {
        console.error('Peer hatası:', err);
        cleanUp();
      });

    } catch (err) {
      const error = err as DOMException;
      
      console.error("Çağrıya cevap verilirken medya alınamadı:", error);
    
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        console.log('Çağrıyı cevaplamak için kamera ve mikrofon erişimine izin vermelisiniz.');
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        console.log('Kullanılabilir kamera veya mikrofon bulunamadı.');
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        console.log('Kameranız veya mikrofonunuz başka bir uygulama tarafından kullanılıyor.');
      } else {
        console.log('Medya aygıtlarına erişirken beklenmedik bir hata oluştu.');
      }
    } finally {
      setIsGettingMedia(false);
    }
  };

  const rejectCall = () => {
    if (socket && incomingCall) {
        socket.emit('call-rejected', { targetUserId: incomingCall.from });
    }
    setIncomingCall(null);
  };

  const endCall = (targetUserId: string) => {
    if(socket) {
        socket.emit('end-call', { targetUserId });
    }
    cleanUp();
    setIsCalling(false);
  };

  const cancelCall = (targetUserId: string) => {
    if (socket) {
      socket.emit('cancel-call', { targetUserId });
    }
    cleanUp();
    setIsCalling(false);
  };


  const value = {
    localStream,
    remoteStream,
    isCallActive,
    isGettingMedia,
    isCalling,
    incomingCall,
    answeredCallUserId,
    callingUserInfo,
    isUserBusy,
    startCall,
    answerCall,
    rejectCall,
    endCall,
    cancelCall,
  };

  return (
    <WebRTCContext.Provider value={value}>{children}</WebRTCContext.Provider>
  );
};