import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import AudioPlayer from "@/components/AudioPlayer";

export const metadata: Metadata = {
  title: "SoundWave Music Player",
  description: "Full-stack music player application with modern UI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#000000] text-white">
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
        </div>

        {/* Audio Player - Fixed at Bottom */}
        <AudioPlayer />
      </body>
    </html>
  );
}
