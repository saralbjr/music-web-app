"use client";

import Link from "next/link";
import { ISong } from "@/models/Song";

interface PlaylistCardProps {
  playlist: {
    _id: string;
    name: string;
    songs?: ISong[];
    description?: string;
  };
}

/**
 * Spotify-style PlaylistCard Component
 * Horizontal card with cover image, title, and description
 */
export default function PlaylistCard({ playlist }: PlaylistCardProps) {
  const coverImage =
    playlist.songs && playlist.songs.length > 0
      ? playlist.songs[0]?.coverUrl
      : null;

  return (
    <Link href={`/playlist/${playlist._id}`}>
      <div className="bg-[#181818] rounded-lg p-4 hover:bg-[#282828] transition-all duration-200 cursor-pointer group">
        <div className="flex gap-4">
          {/* Cover Image */}
          <div className="flex-shrink-0">
            {coverImage ? (
              <img
                src={coverImage}
                alt={playlist.name}
                className="w-16 h-16 rounded object-cover shadow-lg group-hover:shadow-xl transition-shadow"
              />
            ) : (
              <div className="w-16 h-16 bg-[#282828] rounded flex items-center justify-center group-hover:bg-[#333] transition-colors">
                <svg
                  className="w-8 h-8 text-gray-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                </svg>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white truncate mb-1 group-hover:text-blue-400 transition-colors">
              {playlist.name}
            </h3>
            {playlist.description && (
              <p className="text-sm text-gray-400 line-clamp-2">
                {playlist.description}
              </p>
            )}
            {playlist.songs && (
              <p className="text-sm text-gray-500 mt-1">
                {playlist.songs.length} songs
              </p>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}


