import { Navbar } from "@/components/layout/navbar";
import React from "react";
import { SocketProvider } from "@/components/SocketContext";
import { WebRTCProvider } from "@/components/WebRTCContext";

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="w-full flex flex-col items-start">
      <SocketProvider>
        <WebRTCProvider>
          <Navbar />
          {children}
        </WebRTCProvider>
      </SocketProvider>
    </div>
  );
};

export default MainLayout;
