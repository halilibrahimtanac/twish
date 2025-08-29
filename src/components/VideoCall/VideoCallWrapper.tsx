"use client"
import React from 'react'
import { useWebRTC } from '../WebRTCContext';
import { VideoCallModal } from './VideoCallModal';
import { IncomingCallNotification } from './IncomingCallNotification';

const VideoCallWrapper = () => {
    const { isCallActive, incomingCall, cancelCall, callingUserId } = useWebRTC();

  return (
    <>
    {incomingCall && !isCallActive && <IncomingCallNotification />}
    {callingUserId && <button className='fixed bottom-5 left-1/2 -translate-x-1/2 z-50' onClick={() => cancelCall(callingUserId)}>Cancel Call</button>}
    {isCallActive && <VideoCallModal />}
    </>
  )
}

export default VideoCallWrapper