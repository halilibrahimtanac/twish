import { Navbar } from "@/components/layout/navbar";
import VideoCallWrapper from "@/components/VideoCall/VideoCallWrapper";
import React from "react";

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  
  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col items-start sm:px-4 lg:px-6">
      <Navbar />
      {children}

      <VideoCallWrapper />
    </div>
  );
};

export default MainLayout;
