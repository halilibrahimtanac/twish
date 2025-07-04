import { Navbar } from "@/components/layout/navbar";
import React from "react";

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="w-full flex flex-col items-start">
      <Navbar />
      {children}
    </div>
  );
};

export default MainLayout;
