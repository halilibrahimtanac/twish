"use client"
import React from 'react'
import { useWebRTC } from '../WebRTCContext';
import { VideoCallModal } from './VideoCallModal';
import { IncomingCallNotification } from './IncomingCallNotification';

const VideoCallWrapper = () => {
    const { isCallActive, incomingCall } = useWebRTC();
  return (
    <>
    {incomingCall && !isCallActive && <IncomingCallNotification />}
    {isCallActive && <VideoCallModal />}
    </>
  )
}

export default VideoCallWrapper