"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import AudioPlayer from "@/components/AudioPlayer";
import { ToastProvider } from "@/components/ToastProvider";

/**
 * Layout Wrapper Component
 * Conditionally renders Sidebar and Topbar based on route
 * Admin routes should not show sidebar/topbar
 * Also controls the global collapsed/expanded state of the sidebar
 */
export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Hydrate initial sidebar state from localStorage for a smoother UX
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("sidebarCollapsed");
      if (stored !== null) {
        setIsSidebarCollapsed(stored === "true");
      }
    } catch {
      // Ignore storage errors and fall back to default
    }
  }, []);

  // Persist sidebar state so it is remembered across page reloads
  useEffect(() => {
    try {
      window.localStorage.setItem(
        "sidebarCollapsed",
        isSidebarCollapsed ? "true" : "false"
      );
    } catch {
      // Ignore storage errors
    }
  }, [isSidebarCollapsed]);

  if (isAdminRoute) {
    return <>{children}</>;
  }

  const sidebarOffsetClass = isSidebarCollapsed ? "ml-[72px]" : "ml-[250px]";

  return (
    <ToastProvider>
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          collapsed={isSidebarCollapsed}
          onToggle={() => setIsSidebarCollapsed((prev) => !prev)}
        />

        {/* Main Content Area */}
        <div
          className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${sidebarOffsetClass}`}
        >
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
