"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

type SidebarPlaylist = {
  _id: string;
  name: string;
};

type RawSidebarPlaylist = {
  _id?: string | { toString: () => string };
  name?: string;
};

type SidebarProps = {
  collapsed?: boolean;
  onToggle?: () => void;
};

/**
 * Spotify-style Sidebar Component
 * Sticky left sidebar with navigation and playlists
 * Supports collapsed/expanded states controlled by parent layout
 */
export default function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [playlists, setPlaylists] = useState<SidebarPlaylist[]>([]);

  useEffect(() => {
    // Fetch playlists for the sidebar
    const fetchPlaylists = async () => {
      try {
        const user = localStorage.getItem("user");
        const token = localStorage.getItem("token");
        if (user && token) {
          const userData = JSON.parse(user);
          const response = await fetch(`/api/playlists?userId=${userData.id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          const data = await response.json();
          if (data.success) {
            const rawPlaylists: RawSidebarPlaylist[] = data.data || [];
            const typedPlaylists: SidebarPlaylist[] = rawPlaylists.map(
              (playlist) => ({
                _id: playlist?._id?.toString?.() ?? "",
                name: playlist?.name ?? "Untitled Playlist",
              })
            );
            setPlaylists(typedPlaylists);
          }
        } else {
          setPlaylists([]);
        }
      } catch (error) {
        console.error("Error fetching playlists:", error);
      }
    };

    fetchPlaylists();
    window.addEventListener("auth-change", fetchPlaylists);
    window.addEventListener("playlist-update", fetchPlaylists);

    return () => {
      window.removeEventListener("auth-change", fetchPlaylists);
      window.removeEventListener("playlist-update", fetchPlaylists);
    };
  }, []);

  const isActive = (path: string) => pathname === path;

  const navItems = [
    { path: "/", icon: "Home", label: "Home" },
    { path: "/search", icon: "Search", label: "Search" },
    { path: "/library", icon: "Library", label: "Your Library" },
    { path: "/schedules", icon: "Schedule", label: "Schedules" },
    { path: "/analytics", icon: "Analytics", label: "Analytics" },
  ];

  const widthClass = collapsed ? "w-[72px]" : "w-[250px]";
  const showText = !collapsed;

  return (
    <aside
      className={`${widthClass} h-screen bg-[#000000] border-r border-[#222] flex flex-col fixed left-0 top-0 z-40 transition-all duration-300`}
    >
      {/* Logo + Collapse Toggle stacked to avoid overlap */}
      <div className="p-3 flex flex-col gap-3">
        <Link
          href="/"
          className={`flex items-center gap-3 group min-w-0 ${
            collapsed ? "justify-center" : "justify-start"
          }`}
        >
          <div className="relative">
            <svg
              className="w-10 h-10 text-blue-500 group-hover:text-blue-400 transition-colors"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              {/* Music Note Logo */}
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
            </svg>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full opacity-75 group-hover:opacity-100 transition-opacity" />
          </div>
          {showText && (
            <span className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors truncate">
              SoundWave
            </span>
          )}
        </Link>

        <button
          type="button"
          onClick={onToggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="group relative flex h-9 w-9 items-center justify-center rounded-full border border-[#2a2a2a] bg-[#1b1b1b] text-gray-200 hover:bg-[#2b2b2b] hover:text-white transition-colors shadow-sm"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {collapsed ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <nav className="px-2 mb-2">
        {navItems.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            title={collapsed ? item.label : undefined}
            className={`flex items-center ${
              collapsed ? "justify-center" : "justify-start"
            } gap-4 px-3 py-2 rounded-md mb-1 transition-all group ${
              isActive(item.path)
                ? "bg-[#282828] text-white"
                : "text-gray-400 hover:text-white hover:bg-[#181818]"
            }`}
          >
            {item.icon === "Home" && (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
            )}
            {item.icon === "Search" && (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            {item.icon === "Library" && (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
              </svg>
            )}
            {item.icon === "Schedule" && (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            {item.icon === "Analytics" && (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
              </svg>
            )}
            {showText && <span className="font-semibold">{item.label}</span>}
          </Link>
        ))}
        {/* Liked Songs Link */}
        <Link
          href="/liked"
          title={collapsed ? "Favorites" : undefined}
          className={`flex items-center ${
            collapsed ? "justify-center" : "justify-start"
          } gap-4 px-3 py-2 rounded-md mb-1 transition-all group ${
            isActive("/liked")
              ? "bg-[#282828] text-white"
              : "text-gray-400 hover:text-white hover:bg-[#181818]"
          }`}
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
          {showText && <span className="font-semibold">Favorites</span>}
        </Link>
      </nav>

      {/* Create Playlist Button */}
      <div className="px-2 mb-2">
        <button
          onClick={() => {
            const user = localStorage.getItem("user");
            if (!user) {
              router.push("/auth/login");
              return;
            }
            router.push("/playlists");
          }}
          className={`flex items-center ${
            collapsed ? "justify-center" : "justify-start"
          } gap-4 px-3 py-2 rounded-md text-gray-400 hover:text-white hover:bg-[#181818] transition-all w-full group`}
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
              clipRule="evenodd"
            />
          </svg>
          {showText && <span className="font-semibold">Create Playlist</span>}
        </button>
      </div>

      {/* Divider */}
      <div className="border-t border-[#282828] mx-3 my-2" />

      {/* Playlists Section */}
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        <div className="space-y-1">
          {playlists.length > 0 ? (
            playlists.map((playlist) => (
              <Link
                key={playlist._id}
                href={`/playlists/${playlist._id}`}
                title={collapsed ? playlist.name : undefined}
                className={`block px-3 py-2 rounded-md text-sm text-gray-400 hover:text-white hover:bg-[#181818] transition-all truncate ${
                  pathname === `/playlists/${playlist._id}`
                    ? "text-white bg-[#282828]"
                    : ""
                }`}
              >
                {playlist.name}
              </Link>
            ))
          ) : (
            <p className="px-3 py-2 text-sm text-gray-500">No playlists yet</p>
          )}
        </div>
      </div>
    </aside>
  );
}
