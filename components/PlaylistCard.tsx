"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { ISong } from "@/models/Song";

interface PlaylistCardProps {
  playlist: {
    _id: string;
    name: string;
    songs?: ISong[];
    description?: string;
    coverUrl?: string;
  };
  onEdit?: (playlistId: string) => void;
  onDelete?: (playlistId: string) => void;
}

/**
 * Spotify-style PlaylistCard Component
 * Horizontal card with cover image, title, and description
 */
export default function PlaylistCard({
  playlist,
  onEdit,
  onDelete,
}: PlaylistCardProps) {
  const fallbackCover =
    playlist.songs && playlist.songs.length > 0
      ? playlist.songs[0]?.coverFile
      : null;
  const coverImage = playlist.coverUrl || fallbackCover;
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  return (
    <div className="relative group">
      <Link href={`/playlists/${playlist._id}`}>
        <div className="bg-gradient-to-b from-[#2a2a2a] to-[#181818] rounded-2xl p-4 hover:scale-105 transition-transform duration-200 shadow-lg hover:shadow-2xl cursor-pointer">
          <div className="aspect-square rounded-xl overflow-hidden mb-4 bg-[#242424] relative">
            {coverImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coverImage}
                alt={playlist.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <svg
                  className="w-12 h-12 text-white/40"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                </svg>
              </div>
            )}
            <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center shadow-2xl">
                <svg
                  className="w-5 h-5 text-black"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-white truncate mb-1">
              {playlist.name}
            </h3>
            <p className="text-sm text-white/50">
              {playlist.songs?.length || 0} songs
            </p>
          </div>
        </div>
      </Link>
      {(onEdit || onDelete) && (
        <div className="absolute top-3 right-3" ref={menuRef}>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setMenuOpen((prev) => !prev);
            }}
            className="w-8 h-8 rounded-full bg-black/50 backdrop-blur text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zm6 0a2 2 0 11-4 0 2 2 0 014 0zm2 2a2 2 0 100-4 2 2 0 000 4z" />
            </svg>
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-40 rounded-xl bg-[#1f1f1f] border border-white/5 shadow-2xl py-2 z-20">
              {onEdit && (
                <button
                  className="w-full text-left px-4 py-2 text-sm text-white hover:bg-white/10"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setMenuOpen(false);
                    onEdit(playlist._id);
                  }}
                >
                  Edit details
                </button>
              )}
              {onDelete && (
                <button
                  className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-white/10"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setMenuOpen(false);
                    onDelete(playlist._id);
                  }}
                >
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
