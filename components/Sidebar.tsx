"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

/**
 * Spotify-style Sidebar Component
 * Sticky left sidebar with navigation and playlists
 */
export default function Sidebar() {
  const pathname = usePathname();
  const [playlists, setPlaylists] = useState<any[]>([]);

  useEffect(() => {
    // Fetch playlists for the sidebar
    const fetchPlaylists = async () => {
      try {
        const user = localStorage.getItem("user");
        if (user) {
          const userData = JSON.parse(user);
          const response = await fetch(`/api/playlists?userId=${userData.id}`);
          const data = await response.json();
          if (data.success) {
            setPlaylists(data.data || []);
          }
        }
      } catch (error) {
        console.error("Error fetching playlists:", error);
      }
    };

    fetchPlaylists();
  }, []);

  const isActive = (path: string) => pathname === path;

  const navItems = [
    { path: "/", icon: "Home", label: "Home" },
    { path: "/search", icon: "Search", label: "Search" },
    { path: "/library", icon: "Library", label: "Your Library" },
  ];

  return (
    <aside className="w-[250px] h-screen bg-[#000000] border-r border-[#222] flex flex-col fixed left-0 top-0 z-40">
      {/* Logo */}
      <div className="p-6">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative">
            <svg
              className="w-10 h-10 text-blue-500 group-hover:text-blue-400 transition-colors"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              {/* Music Note Logo */}
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
            </svg>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full opacity-75 group-hover:opacity-100 transition-opacity"></div>
          </div>
          <span className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">SoundWave</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="px-3 mb-2">
        {navItems.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className={`flex items-center gap-4 px-3 py-2 rounded-md mb-1 transition-all group ${
              isActive(item.path)
                ? "bg-[#282828] text-white"
                : "text-gray-400 hover:text-white hover:bg-[#181818]"
            }`}
          >
            {item.icon === "Home" && (
              <svg
                className="w-6 h-6"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
            )}
            {item.icon === "Search" && (
              <svg
                className="w-6 h-6"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            {item.icon === "Library" && (
              <svg
                className="w-6 h-6"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
              </svg>
            )}
            <span className="font-semibold">{item.label}</span>
          </Link>
        ))}
        {/* Discover Link */}
        <Link
          href="/discover"
          className={`flex items-center gap-4 px-3 py-2 rounded-md mb-1 transition-all group ${
            isActive("/discover")
              ? "bg-[#282828] text-white"
              : "text-gray-400 hover:text-white hover:bg-[#181818]"
          }`}
        >
          <svg
            className="w-6 h-6"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <span className="font-semibold">Discover</span>
        </Link>
      </nav>

      {/* Create Playlist Button */}
      <div className="px-3 mb-2">
        <button className="flex items-center gap-4 px-3 py-2 rounded-md text-gray-400 hover:text-white hover:bg-[#181818] transition-all w-full group">
          <svg
            className="w-6 h-6"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
              clipRule="evenodd"
            />
          </svg>
          <span className="font-semibold">Create Playlist</span>
        </button>
      </div>

      {/* Divider */}
      <div className="border-t border-[#282828] mx-3 my-2"></div>

      {/* Playlists Section */}
      <div className="flex-1 overflow-y-auto px-3 pb-4">
        <div className="space-y-1">
          {playlists.length > 0 ? (
            playlists.map((playlist) => (
              <Link
                key={playlist._id}
                href={`/playlist/${playlist._id}`}
                className={`block px-3 py-2 rounded-md text-sm text-gray-400 hover:text-white hover:bg-[#181818] transition-all truncate ${
                  pathname === `/playlist/${playlist._id}`
                    ? "text-white bg-[#282828]"
                    : ""
                }`}
              >
                {playlist.name}
              </Link>
            ))
          ) : (
            <p className="px-3 py-2 text-sm text-gray-500">
              No playlists yet
            </p>
          )}
        </div>
      </div>
    </aside>
  );
}
