"use client";
import React from "react";
import { useWebRTC } from "../WebRTCContext";
import { VideoCallModal } from "./VideoCallModal";
import { IncomingCallNotification } from "./IncomingCallNotification";

const VideoCallWrapper = () => {
  const { isCallActive, incomingCall, callingUserInfo } = useWebRTC();

  return (
    <>
      {incomingCall && !isCallActive && <IncomingCallNotification />}
      {callingUserInfo && <IncomingCallNotification callingUserInfo={callingUserInfo}/>}
      {isCallActive && <VideoCallModal />}
    </>
  );
};

export default VideoCallWrapper;