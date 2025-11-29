"use client";

import { useState, useEffect } from "react";
import { ISong } from "@/models/Song";
import { useAudioStore } from "@/lib/store/audioStore";

interface SongCardProps {
  song: ISong;
  queue?: ISong[];
  showLikeButton?: boolean;
}

/**
 * Spotify-style SongCard Component
 * Square card with hover play button overlay
 */
export default function SongCard({ song, queue, showLikeButton = false }: SongCardProps) {
  const { setCurrentSong, currentSong, isPlaying } = useAudioStore();
  const [isLiked, setIsLiked] = useState(false);
  const [liking, setLiking] = useState(false);
  const isCurrentlyPlaying =
    currentSong?._id.toString() === song._id.toString() && isPlaying;

  // Check if song is liked on mount
  useEffect(() => {
    if (showLikeButton) {
      checkIfLiked();
    }
  }, [showLikeButton, song._id]);

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
          const liked = data.data.some(
            (likedSong: ISong) => likedSong._id.toString() === song._id.toString()
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
    setCurrentSong(song, queue);
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
        body: JSON.stringify({ songId: song._id.toString() }),
      });

      const data = await response.json();
      if (data.success) {
        setIsLiked(data.isLiked);
        // Dispatch event to notify other components
        window.dispatchEvent(
          new CustomEvent(data.isLiked ? "song-liked" : "song-unliked", {
            detail: { songId: song._id.toString() },
          })
        );
      }
    } catch (error) {
      console.error("Error liking song:", error);
    } finally {
      setLiking(false);
    }
  };

  return (
    <div className="group">
      <div className="bg-[#181818] rounded-lg p-4 hover:bg-[#282828] transition-all duration-200 cursor-pointer group">
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
                      className={`w-5 h-5 ${isLiked ? "text-white" : "text-white"}`}
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
