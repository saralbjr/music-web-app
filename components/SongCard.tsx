/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { ISong } from "@/models/Song";
import { useAudioStore } from "@/lib/store/audioStore";
import { useToast } from "@/components/ToastProvider";

interface SongCardProps {
  song: ISong;
  queue?: ISong[];
  showLikeButton?: boolean;
}

interface Playlist {
  _id: string;
  name: string;
  songs: string[] | ISong[];
}

/**
 * Spotify-style SongCard Component
 * Square card with hover play button overlay
 */
export default function SongCard({
  song,
  queue,
  showLikeButton = false,
}: SongCardProps) {
  const { setCurrentSong, currentSong, isPlaying } = useAudioStore();
  const [isLiked, setIsLiked] = useState(false);
  const [liking, setLiking] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [playlistsLoaded, setPlaylistsLoaded] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { showToast } = useToast();
  const isCurrentlyPlaying =
    currentSong &&
    (currentSong._id as any)?.toString() === (song._id as any)?.toString() &&
    isPlaying;

  // Check if song is liked on mount
  useEffect(() => {
    if (showLikeButton) {
      checkIfLiked();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showLikeButton, song._id]);

  // Close menu when clicking outside, scrolling, or resizing
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        if (
          buttonRef.current &&
          !buttonRef.current.contains(event.target as Node)
        ) {
          setShowMenu(false);
        }
      }
    };

    const handleScroll = () => {
      setShowMenu(false);
    };

    const handleResize = () => {
      setShowMenu(false);
    };

    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("scroll", handleScroll, true);
      window.addEventListener("resize", handleResize);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleResize);
    };
  }, [showMenu]);

  const checkIfLiked = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch("/api/songs/like", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          const songId = (song._id as any)?.toString();
          const liked = data.data.some(
            (likedSong: ISong) => (likedSong._id as any)?.toString() === songId
          );
          setIsLiked(liked);
        }
      }
    } catch (error) {
      console.error("Error checking if liked:", error);
    }
  };

  const handlePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Require authentication before allowing playback
    const storedUser = typeof window !== "undefined" ? localStorage.getItem("user") : null;
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    if (!storedUser || !token) {
      window.location.href = "/auth/login";
      return;
    }

    setCurrentSong(song, queue);
  };

  const getAuth = () => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (!storedUser || !token) return null;
    const user = JSON.parse(storedUser);
    if (!user.id) return null;
    return { user, token };
  };

  const fetchPlaylists = async () => {
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
        setPlaylists(data.data);
        setPlaylistsLoaded(true);
      }
    } catch (error) {
      console.error("Error fetching playlists:", error);
    }
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }

    setShowMenu(!showMenu);
    if (!playlistsLoaded) {
      fetchPlaylists();
    }
  };

  const handleAddToFavorites = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowMenu(false);

    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/auth/login";
      return;
    }

    setLiking(true);
    try {
      const response = await fetch("/api/songs/like", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ songId: (song._id as any)?.toString() }),
      });

      const data = await response.json();
      if (data.success) {
        setIsLiked(data.isLiked);
        window.dispatchEvent(
          new CustomEvent(data.isLiked ? "song-liked" : "song-unliked", {
            detail: { songId: (song._id as any)?.toString() },
          })
        );
        if (data.isLiked) {
          showToast("Added to Favorites", "success");
        } else {
          showToast("Removed from Favorites", "info");
        }
      } else {
        showToast(data.error || "Could not update Favorites", "error");
      }
    } catch (error) {
      console.error("Error liking song:", error);
      showToast("Something went wrong updating Favorites", "error");
    } finally {
      setLiking(false);
    }
  };

  const handleAddToPlaylist = async (
    playlistId: string,
    playlistName: string
  ) => {
    const auth = getAuth();
    if (!auth) {
      window.location.href = "/auth/login";
      return;
    }

    try {
      const playlist = playlists.find((p) => p._id === playlistId);
      if (!playlist) return;

      const existingIds = Array.isArray(playlist.songs)
        ? playlist.songs.map((s: string | ISong) =>
            typeof s === "string" ? s : (s._id as any)?.toString()
          )
        : [];

      const songId = (song._id as any)?.toString();
      if (existingIds.includes(songId)) {
        showToast("Song already in playlist", "info");
        setShowMenu(false);
        return;
      }

      const nextIds = Array.from(new Set([...existingIds, songId])).filter(
        Boolean
      );
      const res = await fetch("/api/playlists", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({
          playlistId,
          songs: nextIds,
        }),
      });

      const updated = await res.json();
      if (updated.success) {
        showToast(`Added to "${playlistName}"`, "success");
        setPlaylists((prev) =>
          prev.map((p) => (p._id === playlistId ? { ...p, songs: nextIds } : p))
        );
      } else {
        showToast(updated.error || "Failed to add to playlist", "error");
      }
    } catch (error) {
      console.error("Error adding song to playlist:", error);
      showToast("Something went wrong", "error");
    } finally {
      setShowMenu(false);
    }
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const token = localStorage.getItem("token");
    if (!token) {
      // Redirect to login if not authenticated
      window.location.href = "/auth/login";
      return;
    }

    setLiking(true);
    try {
      const response = await fetch("/api/songs/like", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ songId: (song._id as any)?.toString() }),
      });

      const data = await response.json();
      if (data.success) {
        setIsLiked(data.isLiked);
        // Dispatch event to notify other components
        window.dispatchEvent(
          new CustomEvent(data.isLiked ? "song-liked" : "song-unliked", {
            detail: { songId: (song._id as any)?.toString() },
          })
        );
        if (data.isLiked) {
          showToast("Added to Favorites", "success");
        } else {
          showToast("Removed from Favorites", "info");
        }
      } else {
        showToast(data.error || "Could not update Favorites", "error");
      }
    } catch (error) {
      console.error("Error liking song:", error);
      showToast("Something went wrong updating Favorites", "error");
    } finally {
      setLiking(false);
    }
  };

  return (
    <div className="group relative">
      <div className="bg-[#181818] rounded-lg p-4 hover:bg-[#282828] transition-all duration-200 cursor-pointer group">
        {/* 3-dot menu button */}
        <button
          ref={buttonRef}
          onClick={handleMenuClick}
          className="absolute top-2 right-2 z-[90] opacity-0 group-hover:opacity-100 transition-opacity text-white/60 hover:text-white p-2 rounded-full hover:bg-white/10"
          aria-label="Song options"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>

        {/* Dropdown menu - Use Portal to avoid overflow and stacking issues */}
        {showMenu && createPortal(
          <div
            ref={menuRef}
            className="fixed z-[9999] w-56 bg-[#282828] rounded-xl shadow-xl border border-white/10 py-1 text-sm"
            style={{
              top: `${menuPosition.top}px`,
              right: `${menuPosition.right}px`,
            }}
          >
            <button
              type="button"
              onClick={handleAddToFavorites}
              className="w-full text-left px-4 py-2 hover:bg-white/10 text-white"
            >
              {isLiked ? "Remove from Favorites" : "Add to Favorites"}
            </button>
            <div className="border-t border-white/10 my-1" />
            <div className="px-4 py-2 text-xs uppercase tracking-wide text-white/40">
              Add to playlist
            </div>
            <div className="max-h-48 overflow-y-auto">
              {playlists.length === 0 ? (
                <div className="px-4 py-2 text-white/60 text-xs">
                  {playlistsLoaded ? "No playlists" : "Loading..."}
                </div>
              ) : (
                playlists.map((playlist) => {
                  const existingIds = Array.isArray(playlist.songs)
                    ? playlist.songs.map((s: string | ISong) =>
                        typeof s === "string" ? s : (s._id as any)?.toString()
                      )
                    : [];
                  const alreadyIn = existingIds.includes(
                    (song._id as any)?.toString()
                  );

                  return (
                    <button
                      key={playlist._id}
                      type="button"
                      disabled={alreadyIn}
                      onClick={() =>
                        handleAddToPlaylist(playlist._id, playlist.name)
                      }
                      className={`w-full text-left px-4 py-2 hover:bg-white/10 text-white/90 ${
                        alreadyIn ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      {alreadyIn ? `In ${playlist.name}` : playlist.name}
                    </button>
                  );
                })
              )}
            </div>
          </div>,
          document.body
        )}

        <div className="relative mb-4">
          {song.coverFile ? (
            <div className="relative aspect-square rounded-lg overflow-hidden shadow-lg group-hover:shadow-2xl transition-shadow">
              <img
                src={song.coverFile}
                alt={song.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              {/* Play Button Overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center gap-2">
                <button
                  onClick={handlePlay}
                  className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transform transition-all duration-200 ${
                    isCurrentlyPlaying
                      ? "bg-blue-500 scale-100 opacity-100"
                      : "bg-blue-500 scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100"
                  }`}
                  aria-label="Play"
                >
                  {isCurrentlyPlaying ? (
                    <svg
                      className="w-6 h-6 text-white ml-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-6 h-6 text-white ml-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
                {/* Like Button */}
                {showLikeButton && (
                  <button
                    onClick={handleLike}
                    disabled={liking}
                    className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transform transition-all duration-200 ${
                      isLiked
                        ? "bg-blue-500 scale-100 opacity-100"
                        : "bg-white/20 scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100"
                    }`}
                    aria-label={isLiked ? "Unlike" : "Like"}
                  >
                    <svg
                      className={`w-5 h-5 ${
                        isLiked ? "text-white" : "text-white"
                      }`}
                      fill={isLiked ? "currentColor" : "none"}
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="aspect-square bg-[#282828] rounded-lg flex items-center justify-center group-hover:bg-[#333] transition-colors">
              <svg
                className="w-12 h-12 text-gray-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 3a1 1 0 00-1.447-.894L8.763 6H5a3 3 0 000 6h.28l1.771 5.316A1 1 0 008 18h1a1 1 0 001-1v-4.382l6.553 3.276A1 1 0 0018 15V3z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          )}
        </div>
        <h3 className="font-semibold text-white truncate mb-1 group-hover:text-blue-400 transition-colors">
          {song.title}
        </h3>
        <p className="text-sm text-gray-400 truncate">{song.artist}</p>
      </div>
    </div>
  );
}
