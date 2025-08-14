import { Navbar } from "@/components/layout/navbar";
import VideoCallWrapper from "@/components/VideoCall/VideoCallWrapper";
import React from "react";

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  
  return (
    <div className="w-full flex flex-col items-start">
      <Navbar />
      {children}

      <VideoCallWrapper />
    </div>
  );
};

export default MainLayout;
