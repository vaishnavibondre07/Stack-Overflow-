import Navbar from "@/components/Navbar";
import RightSideBar from "@/components/RightSideBar";
import Sidebar from "@/components/Sidebar";
import React, { ReactNode, useEffect, useState } from "react";
interface MainlayoutProps {
  children: ReactNode;
}
const Mainlayout = ({ children }: MainlayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (window.innerWidth <= 1024) {
        setSidebarOpen(false);
      }
    }
  }, []);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1024) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleslidein = () => {
    if (typeof window !== "undefined") {
      if (window.innerWidth <= 1024) {
        setSidebarOpen((state) => !state);
      }
    }
  };

  return (
    <div className="bg-[#f8f9fa] text-[#3a3a3a] min-h-screen">
      <Navbar handleslidein={handleslidein} />
      <div className="flex max-w-full overflow-hidden">
        <Sidebar isopen={sidebarOpen} />
        <main className="flex-1 min-w-0 p-2 sm:p-4 lg:p-6 bg-white overflow-x-hidden">
          {children}
        </main>
        <div className="hidden xl:block border-l border-gray-200 flex-shrink-0">
          <RightSideBar />
        </div>
      </div>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={handleslidein}
        />
      )}
    </div>
  );
};

export default Mainlayout;
