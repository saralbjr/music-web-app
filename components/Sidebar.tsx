"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";

type SidebarPlaylist = {
  _id: string;
  name: string;
  coverUrl?: string;
  songs?: Array<{ coverFile?: string }>;
};

type RawSidebarPlaylist = {
  _id?: string | { toString: () => string };
  name?: string;
  coverUrl?: string;
  songs?: Array<{ coverFile?: string }>;
};

type SidebarProps = {
  collapsed?: boolean;
  onToggle?: () => void;
};

/**
 * Glassmorphism Sidebar Component
 * Features premium glass effects, smooth animations, and fluid interactions
 */
export default function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [playlists, setPlaylists] = useState<SidebarPlaylist[]>([]);

  useEffect(() => {
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
                coverUrl: playlist?.coverUrl,
                songs: playlist?.songs,
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
  ];

  const widthClass = collapsed ? "w-[80px]" : "w-[280px]";
  const showText = !collapsed;

  return (
    <aside
      className={`${widthClass} h-screen bg-[#0a0a0f]/80 backdrop-blur-2xl border-r border-white/[0.06] flex flex-col fixed left-0 top-0 z-40 transition-all duration-500 ease-out`}
    >
      {/* Gradient accent line */}
      <div className="absolute top-0 right-0 bottom-0 w-px bg-gradient-to-b from-blue-500/20 via-transparent to-cyan-500/20" />

      {/* Header Section */}
      <div className={`p-6 flex ${collapsed ? "flex-col items-center gap-4" : "items-center justify-between"} transition-all duration-300`}>
        <Link
          href="/"
          className={`flex items-center gap-3 group relative ${collapsed ? 'justify-center' : ''}`}
        >
          {/* Logo Glow */}
          <div className="absolute -inset-2 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          <div className="relative w-10 h-10 flex items-center justify-center bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl shadow-lg shadow-blue-500/25 group-hover:shadow-blue-500/40 transition-all duration-300 group-hover:scale-105">
            <svg
              className="w-6 h-6 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
            </svg>
          </div>

          {showText && (
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70 group-hover:to-white transition-all duration-300 tracking-tight">
              SoundWave
            </span>
          )}
        </Link>

        {/* Toggle Button */}
        <button
          type="button"
          onClick={onToggle}
          className={`
            w-8 h-8 flex items-center justify-center rounded-full
            text-white/40 hover:text-white hover:bg-white/10
            transition-all duration-300 border border-transparent hover:border-white/10
            ${collapsed ? '' : 'bg-transparent'}
          `}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {collapsed ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="m5.25 4.5 7.5 7.5-7.5 7.5m6-15 7.5 7.5-7.5 7.5" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            )}
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <nav className="px-3 py-2 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            title={collapsed ? item.label : undefined}
            className={`
              relative flex items-center ${collapsed ? "justify-center" : "justify-start"}
              gap-4 px-4 py-3 rounded-xl transition-all duration-300 group
              ${isActive(item.path)
                ? "bg-white/[0.08] text-white"
                : "text-white/50 hover:text-white hover:bg-white/[0.04]"
              }
            `}
          >
            {/* Active Glow */}
            {isActive(item.path) && (
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-xl" />
            )}

            {/* Active Indicator Line */}
            {!collapsed && isActive(item.path) && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-gradient-to-b from-blue-400 to-cyan-500 rounded-r-full shadow-[0_0_12px_rgba(59,130,246,0.5)]" />
            )}

            <span className={`relative z-10 transition-transform duration-300 ${isActive(item.path) ? "scale-110" : "group-hover:scale-110"}`}>
              {item.icon === "Home" && (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              )}
              {item.icon === "Search" && (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              )}
              {item.icon === "Library" && (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              )}
            </span>
            {showText && <span className="relative z-10 font-medium tracking-wide">{item.label}</span>}
          </Link>
        ))}

        {/* Favorites Link */}
        <Link
          href="/liked"
          title={collapsed ? "Favorites" : undefined}
          className={`
            relative flex items-center ${collapsed ? "justify-center" : "justify-start"}
            gap-4 px-4 py-3 rounded-xl transition-all duration-300 group
            ${isActive("/liked")
              ? "bg-gradient-to-r from-blue-500/15 to-cyan-500/15 text-white border border-blue-500/20"
              : "text-white/50 hover:text-white hover:bg-white/[0.04]"
            }
          `}
        >
          <span className={`relative z-10 transition-transform duration-300 ${isActive("/liked") ? "scale-110" : "group-hover:scale-110"}`}>
            <div className={`w-6 h-6 rounded-md flex items-center justify-center ${isActive("/liked") ? "bg-gradient-to-br from-blue-500 to-cyan-600 shadow-lg shadow-blue-500/30" : "bg-white/10 group-hover:bg-white/15"}`}>
              <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
          </span>
          {showText && <span className="relative z-10 font-medium tracking-wide">Favorites</span>}
        </Link>
      </nav>

      {/* Divider */}
      <div className="px-6 my-4">
        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>

      {/* Playlists Header & Create */}
      <div className="px-3 mb-2">
        {!collapsed && (
          <div className="flex items-center justify-between px-3 mb-3">
            <span className="text-[11px] font-semibold tracking-widest uppercase text-white/40">Your Playlists</span>
            <button
              onClick={() => {
                const user = localStorage.getItem("user");
                if (!user) {
                  router.push("/auth/login");
                  return;
                }
                router.push("/playlists");
              }}
              className="p-1.5 hover:bg-white/10 rounded-full transition-all text-white/40 hover:text-white border border-transparent hover:border-white/10"
              title="Create Playlist"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        )}

        {collapsed && (
          <button
            onClick={() => router.push("/playlists")}
            className="w-full flex justify-center p-3 mb-2 rounded-xl text-white/40 hover:text-white hover:bg-white/[0.06] transition-all border border-transparent hover:border-white/10"
            title="Create Playlist"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        )}
      </div>

      {/* Playlists Scroll Area */}
      <div className={`flex-1 overflow-y-auto px-3 pb-28 ${!collapsed ? 'block' : ''}`}>
        <div className="space-y-1">
          {playlists.length > 0 ? (
            playlists.map((playlist) => {
              const fallbackCover = playlist.songs && playlist.songs.length > 0
                ? playlist.songs[0]?.coverFile
                : null;
              const coverImage = playlist.coverUrl || fallbackCover;
              const isPlaylistActive = pathname === `/playlists/${playlist._id}`;

              if (collapsed) {
                return (
                  <Link
                    key={playlist._id}
                    href={`/playlists/${playlist._id}`}
                    title={playlist.name}
                    className={`
                      relative block w-12 h-12 mx-auto rounded-xl overflow-hidden transition-all duration-300 group
                      ${isPlaylistActive
                        ? "ring-2 ring-blue-500 scale-105"
                        : "hover:ring-2 hover:ring-white/20 hover:scale-105 opacity-60 hover:opacity-100"
                      }
                    `}
                  >
                    {coverImage ? (
                      <Image
                        src={coverImage}
                        alt={playlist.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center">
                        <svg className="w-5 h-5 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                        </svg>
                      </div>
                    )}
                    {isPlaylistActive && (
                      <div className="absolute inset-0 bg-blue-500/20" />
                    )}
                  </Link>
                );
              }

              return (
                <Link
                  key={playlist._id}
                  href={`/playlists/${playlist._id}`}
                  className={`
                    group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200
                    ${isPlaylistActive
                      ? "bg-white/[0.08] text-white"
                      : "text-white/50 hover:text-white hover:bg-white/[0.04]"
                    }
                  `}
                >
                  {/* Cover */}
                  <div className={`
                    relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 transition-all ring-1
                    ${isPlaylistActive
                      ? 'ring-blue-500/50 opacity-100'
                      : 'ring-white/10 opacity-60 group-hover:opacity-100 group-hover:ring-white/20'
                    }
                  `}>
                    {coverImage ? (
                      <Image src={coverImage} alt={playlist.name} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center">
                        <svg className="w-4 h-4 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <span className="truncate font-medium">{playlist.name}</span>
                  {isPlaylistActive && (
                    <div className="ml-auto flex items-center gap-0.5">
                      <span className="w-1 h-1 bg-blue-400 rounded-full animate-pulse" />
                      <span className="w-1 h-1 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                      <span className="w-1 h-1 bg-sky-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                    </div>
                  )}
                </Link>
              );
            })
          ) : (
            <div className={`mt-8 text-center ${collapsed ? "hidden" : "block"}`}>
              <div className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
              <p className="text-sm text-white/40 mb-4">Your library is empty</p>
              <button
                onClick={() => router.push("/playlists")}
                className="px-4 py-2 bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 hover:border-white/20 rounded-full text-xs font-semibold text-white transition-all"
              >
                Create first playlist
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
