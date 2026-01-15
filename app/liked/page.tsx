"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { ISong } from "@/models/Song";
import { useAudioStore } from "@/lib/store/audioStore";
import { useToast } from "@/components/ToastProvider";
import { mergeSort } from "@/lib/algorithms/mergeSort";
import Image from "next/image";

/**
 * Liked Songs Page - Premium Redesign
 * A stunning, modern interface for user's favorite tracks
 */
export default function LikedSongsPage() {
  const router = useRouter();
  const { setCurrentSong, currentSong, isPlaying } = useAudioStore();
  const [likedSongs, setLikedSongs] = useState<ISong[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSongMenuId, setShowSongMenuId] = useState<string | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  interface Playlist {
    _id: string;
    name: string;
    songs: string[] | ISong[];
  }
  const [menuPlaylists, setMenuPlaylists] = useState<Playlist[]>([]);
  const [menuPlaylistsLoaded, setMenuPlaylistsLoaded] = useState(false);
  const { showToast } = useToast();
  const [sortOption, setSortOption] = useState<
    "added" | "title" | "artist" | "duration"
  >("added");
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });

  // Close menus on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (sortMenuOpen) setSortMenuOpen(false);
      if (showSongMenuId) setShowSongMenuId(null);
    };
    window.addEventListener("scroll", handleScroll, true);
    return () => window.removeEventListener("scroll", handleScroll, true);
  }, [sortMenuOpen, showSongMenuId]);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (!storedUser || !token) {
      router.replace("/auth/login");
      setLoading(false);
      return;
    }

    const user = JSON.parse(storedUser);
    if (!user.id) {
      router.replace("/auth/login");
      setLoading(false);
      return;
    }

    fetchLikedSongs(token);
  }, [router]);

  const fetchLikedSongs = async (token: string) => {
    try {
      const likedSongsResponse = await fetch("/api/songs/like", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const likedSongsData = await likedSongsResponse.json();
      if (likedSongsData.success) {
        setLikedSongs(likedSongsData.data || []);
      }
    } catch (error) {
      console.error("Error fetching liked songs:", error);
    } finally {
      setLoading(false);
    }
  };

  const getAuth = () => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (!storedUser || !token) return null;
    const user = JSON.parse(storedUser);
    if (!user.id) return null;
    return { user, token };
  };

  const fetchUserPlaylists = async () => {
    try {
      const auth = getAuth();
      if (!auth) return;
      const response = await fetch(`/api/playlists?userId=${auth.user.id}`, {
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
      });
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setMenuPlaylists(data.data);
        setMenuPlaylistsLoaded(true);
      }
    } catch (error) {
      console.error("Error fetching playlists for favorites menu:", error);
    }
  };

  const handleToggleFavorite = async (songId: string) => {
    const auth = getAuth();
    if (!auth) return;
    try {
      const res = await fetch("/api/songs/like", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({ songId }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchLikedSongs(auth.token);
        if (data.isLiked) {
          showToast("Added to Favorites", "success");
        } else {
          showToast("Removed from Favorites", "info");
        }
      } else {
        showToast(data.error || "Could not update Favorites", "error");
      }
    } catch (error) {
      console.error("Error toggling favorite from favorites page:", error);
      showToast("Something went wrong updating Favorites", "error");
    }
  };

  useEffect(() => {
    const handleLikeChange = () => {
      const token = localStorage.getItem("token");
      if (token) {
        fetchLikedSongs(token);
      }
    };

    window.addEventListener("song-liked", handleLikeChange);
    window.addEventListener("song-unliked", handleLikeChange);

    return () => {
      window.removeEventListener("song-liked", handleLikeChange);
      window.removeEventListener("song-unliked", handleLikeChange);
    };
  }, []);

  const ensureSongId = (value: unknown): string => {
    if (!value) return "";
    if (typeof value === "string") return value;
    if (typeof value === "number") return String(value);
    if (typeof value === "object" && "toString" in value) {
      return String(value as { toString(): string });
    }
    return "";
  };

  const formatDuration = (seconds: number | undefined): string => {
    if (!seconds || Number.isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSongClick = (song: ISong) => {
    if (!likedSongs || likedSongs.length === 0) return;
    setCurrentSong(song, likedSongs);
  };

  const currentSongId = useMemo(
    () => (currentSong ? ensureSongId(currentSong._id) : null),
    [currentSong]
  );

  const sortedLikedSongs = useMemo(() => {
    const base = [...likedSongs];
    switch (sortOption) {
      case "title":
        return mergeSort(base, "title", "asc");
      case "artist":
        return mergeSort(base, "artist", "asc");
      case "duration":
        return mergeSort(base, "duration", "asc");
      case "added":
      default:
        return base;
    }
  }, [likedSongs, sortOption]);

  const sortLabel: Record<
    "added" | "title" | "artist" | "duration",
    string
  > = {
    added: "Recently Added",
    title: "Title",
    artist: "Artist",
    duration: "Duration",
  };

  const totalDuration = useMemo(() => {
    const total = likedSongs.reduce((acc, song) => acc + (song.duration || 0), 0);
    const hours = Math.floor(total / 3600);
    const mins = Math.floor((total % 3600) / 60);
    if (hours > 0) {
      return `${hours} hr ${mins} min`;
    }
    return `${mins} min`;
  }, [likedSongs]);

  // Loading State with Premium Skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] overflow-hidden">
        {/* Animated Background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-blue-500/10 via-transparent to-transparent rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-cyan-500/10 via-transparent to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        </div>

        <div className="relative z-10 p-6 md:p-10 pb-32">
          {/* Hero Skeleton */}
          <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-end mb-12">
            <div className="w-56 h-56 lg:w-64 lg:h-64 rounded-3xl bg-gradient-to-br from-white/5 to-white/[0.02] animate-pulse" />
            <div className="flex-1 space-y-4">
              <div className="h-4 w-20 bg-white/10 rounded-full animate-pulse" />
              <div className="h-14 w-72 bg-white/10 rounded-2xl animate-pulse" />
              <div className="h-4 w-48 bg-white/10 rounded-full animate-pulse" />
            </div>
          </div>

          {/* Song List Skeleton */}
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="h-20 rounded-2xl bg-gradient-to-r from-white/5 to-white/[0.02] animate-pulse"
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] overflow-x-hidden">
      {/* Animated Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-blue-500/20 via-cyan-500/10 to-transparent rounded-full blur-[120px] animate-float-slow" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-gradient-to-tl from-indigo-500/15 via-blue-500/10 to-transparent rounded-full blur-[100px] animate-float-slower" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-blue-500/5 to-transparent rounded-full" />
      </div>

      {/* Grain Overlay */}
      <div className="fixed inset-0 opacity-[0.015] pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PC9maWx0ZXI+PHJlY3QgZmlsdGVyPSJ1cmwoI2EpIiBoZWlnaHQ9IjEwMCUiIHdpZHRoPSIxMDAlIi8+PC9zdmc+')]" />

      <div className="relative z-10 p-6 md:p-10 pb-40">
        {/* Hero Section */}
        <div ref={heroRef} className="mb-12">
          <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-end">
            {/* Album Art / Cover */}
            <div className="group relative">
              <div className="absolute -inset-1 bg-gradient-to-br from-blue-500 via-cyan-500 to-sky-500 rounded-[28px] blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-500" />
              <div className="relative w-56 h-56 lg:w-64 lg:h-64 rounded-3xl bg-gradient-to-br from-blue-500 via-cyan-500 to-sky-600 shadow-2xl shadow-blue-500/25 flex items-center justify-center overflow-hidden">
                {/* Animated Hearts Background */}
                <div className="absolute inset-0 overflow-hidden">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute animate-float-heart"
                      style={{
                        left: `${15 + i * 15}%`,
                        top: `${20 + (i % 3) * 25}%`,
                        animationDelay: `${i * 0.5}s`,
                        opacity: 0.15,
                      }}
                    >
                      <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </div>
                  ))}
                </div>
                {/* Main Heart Icon */}
                <svg className="w-24 h-24 lg:w-28 lg:h-28 text-white drop-shadow-2xl relative z-10 group-hover:scale-110 transition-transform duration-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
            </div>

            {/* Title & Meta */}
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/20 text-blue-300 text-xs font-semibold uppercase tracking-widest backdrop-blur-sm">
                  Collection
                </span>
              </div>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-white tracking-tight">
                Favorites
              </h1>

              <div className="flex items-center gap-4 text-sm text-white/60">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center text-white text-xs font-bold shadow-lg">
                    ♥
                  </div>
                  <span className="font-medium text-white/80">Your Favorites</span>
                </div>
                <span className="w-1 h-1 rounded-full bg-white/40" />
                <span className="font-medium">{likedSongs.length} songs</span>
                <span className="w-1 h-1 rounded-full bg-white/40" />
                <span className="font-medium">{totalDuration}</span>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          {likedSongs.length > 0 && (
            <div className="flex items-center gap-6 mt-10">
              {/* Play Button */}
              <button
                onClick={() => likedSongs.length > 0 && setCurrentSong(likedSongs[0], likedSongs)}
                className="group relative"
              >
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full blur-lg opacity-60 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all duration-200">
                  <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </button>

              {/* Shuffle Button */}
              <button
                onClick={() => {
                  if (likedSongs.length > 0) {
                    const randomIndex = Math.floor(Math.random() * likedSongs.length);
                    setCurrentSong(likedSongs[randomIndex], likedSongs);
                  }
                }}
                className="w-11 h-11 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 flex items-center justify-center text-white/60 hover:text-white transition-all duration-200 hover:scale-105"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>

              {/* Sort Dropdown */}
              <div className="relative ml-auto">
                <button
                  type="button"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setMenuPosition({
                      top: rect.bottom + 8,
                      right: window.innerWidth - rect.right,
                    });
                    setSortMenuOpen((prev) => !prev);
                  }}
                  className="flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-200 group"
                >
                  <svg className="w-4 h-4 text-white/50 group-hover:text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                  </svg>
                  <span className="text-sm text-white/70 group-hover:text-white/90 font-medium">{sortLabel[sortOption]}</span>
                  <svg className={`w-4 h-4 text-white/50 transition-transform duration-200 ${sortMenuOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {sortMenuOpen && createPortal(
                  <>
                    <div className="fixed inset-0 z-[9998]" onClick={() => setSortMenuOpen(false)} />
                    <div
                      className="fixed z-[9999] w-52 bg-[#1a1a24]/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl shadow-black/50 py-2 overflow-hidden animate-slideDown"
                      style={{
                        top: `${menuPosition.top}px`,
                        right: `${menuPosition.right}px`,
                      }}
                    >
                      {(Object.keys(sortLabel) as Array<"added" | "title" | "artist" | "duration">).map((option) => (
                        <button
                          key={option}
                          onClick={() => {
                            setSortOption(option);
                            setSortMenuOpen(false);
                          }}
                          className={`w-full text-left px-4 py-3 text-sm flex items-center justify-between hover:bg-white/5 transition-colors ${
                            sortOption === option ? "text-blue-400" : "text-white/70 hover:text-white"
                          }`}
                        >
                          <span className="font-medium">{sortLabel[option]}</span>
                          {sortOption === option && (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  </>,
                  document.body
                )}
              </div>
            </div>
          )}
        </div>

        {/* Song List */}
        {likedSongs.length > 0 ? (
          <div className="space-y-2">
            {/* Table Header */}
            <div className="grid grid-cols-[40px_1fr_auto] md:grid-cols-[50px_1fr_1fr_100px_50px] gap-4 px-5 py-3 text-xs uppercase tracking-wider text-white/40 font-semibold border-b border-white/5">
              <div className="text-center">#</div>
              <div>Title</div>
              <div className="hidden md:block">Artist</div>
              <div className="hidden md:flex items-center justify-end gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div />
            </div>

            {/* Songs */}
            <div className="space-y-1">
              {sortedLikedSongs.map((song, index) => {
                const songId = ensureSongId(song._id);
                const isPlayingSong = currentSongId !== null && currentSongId === songId && isPlaying;
                const isHovered = hoveredIndex === index;

                return (
                  <div
                    key={songId}
                    onClick={() => handleSongClick(song)}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    className={`group grid grid-cols-[40px_1fr_auto] md:grid-cols-[50px_1fr_1fr_100px_50px] gap-4 px-5 py-3 rounded-xl cursor-pointer transition-all duration-200 items-center ${
                      isPlayingSong
                        ? "bg-gradient-to-r from-blue-500/10 to-cyan-500/5 border border-blue-500/20"
                        : "hover:bg-white/[0.03] border border-transparent"
                    }`}
                  >
                    {/* Index / Play Icon */}
                    <div className="flex items-center justify-center text-white/40 group-hover:text-white w-full text-sm font-medium">
                      {isPlayingSong ? (
                        <div className="flex items-end gap-0.5 h-4">
                          <span className="w-1 bg-blue-400 rounded-full animate-equalizer-1" />
                          <span className="w-1 bg-blue-400 rounded-full animate-equalizer-2" />
                          <span className="w-1 bg-blue-400 rounded-full animate-equalizer-3" />
                        </div>
                      ) : (
                        <>
                          <span className={`${isHovered ? "hidden" : "block"}`}>{index + 1}</span>
                          <svg className={`w-5 h-5 ${isHovered ? "block" : "hidden"} text-white`} fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </>
                      )}
                    </div>

                    {/* Title & Cover */}
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="relative flex-shrink-0">
                        {song.coverFile ? (
                          <Image
                            src={song.coverFile}
                            alt={song.title}
                            width={48}
                            height={48}
                            className="w-12 h-12 rounded-lg shadow-lg object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center">
                            <svg className="w-5 h-5 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                            </svg>
                          </div>
                        )}
                        {isPlayingSong && (
                          <div className="absolute inset-0 rounded-lg bg-black/40 flex items-center justify-center">
                            <div className="w-3 h-3 rounded-full bg-blue-400 animate-pulse" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className={`text-base font-semibold truncate ${isPlayingSong ? "text-blue-400" : "text-white group-hover:text-white"}`}>
                          {song.title}
                        </div>
                        <div className="text-sm text-white/50 truncate md:hidden group-hover:text-white/70 transition-colors">
                          {song.artist}
                        </div>
                      </div>
                    </div>

                    {/* Artist (Desktop) */}
                    <div className="hidden md:flex items-center text-sm text-white/50 group-hover:text-white/80 transition-colors truncate font-medium">
                      {song.artist}
                    </div>

                    {/* Duration */}
                    <div className="hidden md:flex items-center justify-end text-sm text-white/40 tabular-nums font-medium">
                      {formatDuration(song.duration)}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleFavorite(songId);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 text-blue-400 hover:text-blue-300"
                        title="Remove from favorites"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </button>

                      <div className="relative">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const rect = e.currentTarget.getBoundingClientRect();
                            setMenuPosition({
                              top: rect.bottom + 8,
                              right: window.innerWidth - rect.right,
                            });
                            setShowSongMenuId((current) => current === songId ? null : songId);
                            if (!menuPlaylistsLoaded) fetchUserPlaylists();
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-all duration-200 text-white/40 hover:text-white p-1.5 rounded-full hover:bg-white/10"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zm6 0a2 2 0 11-4 0 2 2 0 014 0zm2 2a2 2 0 100-4 2 2 0 000 4z" />
                          </svg>
                        </button>

                        {showSongMenuId === songId && createPortal(
                          <>
                            <div className="fixed inset-0 z-[9998]" onClick={() => setShowSongMenuId(null)} />
                            <div
                              className="fixed z-[9999] w-60 bg-[#1a1a24]/95 backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl shadow-black/50 py-2 animate-slideDown"
                              style={{
                                top: `${menuPosition.top}px`,
                                right: `${menuPosition.right}px`,
                              }}
                            >
                              <div className="px-4 py-2 text-xs uppercase tracking-wider text-white/40 font-semibold">
                                Add to Playlist
                              </div>
                              <div className="max-h-48 overflow-y-auto">
                                {menuPlaylists.length === 0 ? (
                                  <div className="px-4 py-3 text-white/50 text-sm italic">
                                    No playlists found.
                                  </div>
                                ) : (
                                  menuPlaylists.map((p) => {
                                    const existingIds = Array.isArray(p.songs)
                                      ? p.songs.map((s) => ensureSongId(typeof s === "string" ? s : s._id))
                                      : [];
                                    const alreadyIn = existingIds.includes(songId);

                                    return (
                                      <button
                                        key={p._id}
                                        type="button"
                                        disabled={alreadyIn}
                                        onClick={async (e) => {
                                          e.stopPropagation();
                                          if (alreadyIn) return;
                                          const auth = getAuth();
                                          if (!auth) return;
                                          try {
                                            const nextIds = Array.from(new Set([...existingIds, songId])).filter(Boolean);
                                            const res = await fetch("/api/playlists", {
                                              method: "PUT",
                                              headers: {
                                                "Content-Type": "application/json",
                                                Authorization: `Bearer ${auth.token}`,
                                              },
                                              body: JSON.stringify({
                                                playlistId: p._id,
                                                songs: nextIds,
                                              }),
                                            });
                                            const updated = await res.json();
                                            if (updated.success) {
                                              showToast(`Added to "${p.name}"`, "success");
                                            } else {
                                              showToast(updated.error || "Failed", "error");
                                            }
                                          } catch (error) {
                                            console.error("Error adding to playlist:", error);
                                          } finally {
                                            setShowSongMenuId(null);
                                          }
                                        }}
                                        className={`w-full text-left px-4 py-3 hover:bg-white/5 transition-colors flex items-center justify-between ${
                                          alreadyIn ? "opacity-40 cursor-not-allowed" : "text-white/80 hover:text-white"
                                        }`}
                                      >
                                        <span className="truncate text-sm font-medium">{p.name}</span>
                                        {alreadyIn && (
                                          <svg className="w-4 h-4 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                          </svg>
                                        )}
                                      </button>
                                    );
                                  })
                                )}
                              </div>
                            </div>
                          </>,
                          document.body
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="relative mb-8">
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-full blur-2xl" />
              <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center">
                <svg className="w-12 h-12 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">Songs you like will appear here</h3>
            <p className="text-white/50 mb-8 max-w-sm">Save songs by tapping the heart icon. Build your personal collection of favorites.</p>
            <button
              onClick={() => router.push("/search")}
              className="group relative"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full blur-lg opacity-60 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative px-8 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-bold rounded-full hover:scale-105 active:scale-95 transition-transform shadow-xl">
                Find Songs
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        @keyframes float-slow {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(30px, -30px) rotate(5deg); }
        }
        @keyframes float-slower {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(-20px, 20px) rotate(-3deg); }
        }
        @keyframes float-heart {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.15; }
          50% { transform: translateY(-10px) scale(1.1); opacity: 0.25; }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes equalizer-1 {
          0%, 100% { height: 4px; }
          50% { height: 16px; }
        }
        @keyframes equalizer-2 {
          0%, 100% { height: 8px; }
          50% { height: 12px; }
        }
        @keyframes equalizer-3 {
          0%, 100% { height: 6px; }
          50% { height: 14px; }
        }
        .animate-float-slow {
          animation: float-slow 20s ease-in-out infinite;
        }
        .animate-float-slower {
          animation: float-slower 25s ease-in-out infinite;
        }
        .animate-float-heart {
          animation: float-heart 3s ease-in-out infinite;
        }
        .animate-slideDown {
          animation: slideDown 0.2s ease-out;
        }
        .animate-equalizer-1 {
          animation: equalizer-1 0.5s ease-in-out infinite;
        }
        .animate-equalizer-2 {
          animation: equalizer-2 0.6s ease-in-out infinite 0.1s;
        }
        .animate-equalizer-3 {
          animation: equalizer-3 0.5s ease-in-out infinite 0.2s;
        }
      `}</style>
    </div>
  );
}
