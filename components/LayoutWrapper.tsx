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
 * Features a premium glassmorphism design with animated background
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

  const sidebarOffsetClass = isSidebarCollapsed ? "ml-[80px]" : "ml-[280px]";

  return (
    <ToastProvider>
      {/* Base Background */}
      <div className="fixed inset-0 bg-[#050508] -z-20" />

      {/* Animated Gradient Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        {/* Top Left - Violet Orb */}
        <div
          className="absolute -top-[300px] -left-[200px] w-[800px] h-[800px] rounded-full opacity-30 animate-float-slow"
          style={{
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.4) 0%, rgba(59, 130, 246, 0) 70%)',
          }}
        />

        {/* Top Right - Pink Orb */}
        <div
          className="absolute -top-[200px] -right-[300px] w-[700px] h-[700px] rounded-full opacity-25 animate-float-slower"
          style={{
            background: 'radial-gradient(circle, rgba(6, 182, 212, 0.35) 0%, rgba(6, 182, 212, 0) 70%)',
            animationDelay: '2s',
          }}
        />

        {/* Bottom Left - Blue Orb */}
        <div
          className="absolute -bottom-[400px] -left-[300px] w-[900px] h-[900px] rounded-full opacity-20 animate-float-slower"
          style={{
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, rgba(59, 130, 246, 0) 70%)',
            animationDelay: '4s',
          }}
        />

        {/* Bottom Right - Fuchsia Orb */}
        <div
          className="absolute -bottom-[300px] -right-[200px] w-[700px] h-[700px] rounded-full opacity-25 animate-float-slow"
          style={{
            background: 'radial-gradient(circle, rgba(14, 165, 233, 0.3) 0%, rgba(14, 165, 233, 0) 70%)',
            animationDelay: '1s',
          }}
        />

        {/* Center Glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] rounded-full opacity-10"
          style={{
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, transparent 60%)',
          }}
        />

        {/* Grain Texture Overlay */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

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
          <main className="flex-1 overflow-y-auto pb-28 relative">
            {/* Content Glass Container */}
            <div className="min-h-full">
              {children}
            </div>
          </main>
        </div>

        {/* Audio Player - Fixed at Bottom */}
        <AudioPlayer />
      </div>
    </ToastProvider>
  );
}
