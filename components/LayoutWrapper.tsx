"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import AudioPlayer from "@/components/AudioPlayer";
import { ToastProvider } from "@/components/ToastProvider";

/**
 * Layout Wrapper Component
 * Conditionally renders Sidebar and Topbar based on route
 * Admin routes should not show sidebar/topbar
 */
export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");

  if (isAdminRoute) {
    return (
      <>
        {children}
      </>
    );
  }

  return (
    <ToastProvider>
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden ml-[250px]">
          {/* Topbar */}
          <Topbar />

          {/* Scrollable Content */}
          <main className="flex-1 overflow-y-auto bg-[#121212] pb-24">
            {children}
          </main>
        </div>

        {/* Audio Player - Fixed at Bottom */}
        <AudioPlayer />
      </div>
    </ToastProvider>
  );
}





