"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ISong } from "@/models/Song";
import { useAudioStore } from "@/lib/store/audioStore";
import { fisherYatesShuffle } from "@/lib/algorithms/shuffle";

interface Playlist {
  _id: string;
  name: string;
  songs: ISong[];
}

/**
 * Spotify-style Playlist Detail Page
 * Big header with blurred background, table-like song list
 */
export default function PlaylistPage() {
  const params = useParams();
  const router = useRouter();
  const { setCurrentSong, currentSong, isPlaying } = useAudioStore();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [headerHeight, setHeaderHeight] = useState(0);

  useEffect(() => {
    fetchPlaylist();
  }, [params.id]);

  useEffect(() => {
    const header = document.getElementById("playlist-header");
    if (header) {
      setHeaderHeight(header.offsetHeight);
    }
  }, [playlist]);

  const fetchPlaylist = async () => {
    try {
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

      const response = await fetch(`/api/playlists?userId=${user.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        const foundPlaylist = data.data.find(
          (p: Playlist) => p._id === params.id
        );
        if (foundPlaylist) {
          setPlaylist(foundPlaylist);
        }
      }
    } catch (error) {
      console.error("Error fetching playlist:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayAll = () => {
    if (playlist && playlist.songs.length > 0) {
      setCurrentSong(playlist.songs[0], playlist.songs);
    }
  };

  const handleShuffle = () => {
    if (playlist && playlist.songs.length > 0) {
      const shuffled = fisherYatesShuffle([...playlist.songs]);
      setCurrentSong(shuffled[0], shuffled);
    }
  };

  const handleSongClick = (song: ISong) => {
    if (playlist) {
      setCurrentSong(song, playlist.songs);
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-8">
          <div className="h-64 bg-[#282828] rounded"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-[#282828] rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <p className="text-gray-400">Playlist not found.</p>
        </div>
      </div>
    );
  }

  const coverImage =
    playlist.songs && playlist.songs.length > 0
      ? playlist.songs[0]?.coverUrl
      : null;
  const gradientColor = coverImage ? "from-blue-500" : "from-[#535353]";

  return (
    <div className="relative">
      {/* Header with Blurred Background */}
      <div
        id="playlist-header"
        className={`relative bg-gradient-to-b ${gradientColor} to-[#121212] pt-16 pb-8 px-8`}
      >
        <div className="flex items-end gap-6">
          {coverImage ? (
            <img
              src={coverImage}
              alt={playlist.name}
              className="w-56 h-56 rounded-lg shadow-2xl object-cover"
            />
          ) : (
            <div className="w-56 h-56 bg-[#282828] rounded-lg shadow-2xl flex items-center justify-center">
              <svg
                className="w-24 h-24 text-gray-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
              </svg>
            </div>
          )}

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold mb-2">Playlist</p>
            <h1 className="text-5xl md:text-7xl font-bold mb-4 truncate">
              {playlist.name}
            </h1>
            <p className="text-sm text-gray-300">
              {playlist.songs.length} songs
            </p>
          </div>
        </div>

        {/* Play Button */}
        <div className="mt-6 flex items-center gap-4">
          <button
            onClick={handlePlayAll}
            className="w-14 h-14 bg-blue-500 rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-lg hover:shadow-xl"
            aria-label="Play"
          >
            <svg
              className="w-6 h-6 text-black ml-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          <button
            onClick={handleShuffle}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Shuffle"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Songs Table */}
      <div className="px-8 py-4 bg-[#121212] bg-opacity-40">
        {playlist.songs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400">This playlist is empty.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {/* Table Header */}
            <div className="grid grid-cols-[16px_1fr_1fr_auto] md:grid-cols-[16px_1fr_1fr_1fr_auto] gap-4 px-4 py-2 text-xs text-gray-400 border-b border-[#282828]">
              <div>#</div>
              <div>TITLE</div>
              <div className="hidden md:block">ALBUM</div>
              <div className="hidden md:block">DATE ADDED</div>
              <div className="text-right">
                <svg className="w-4 h-4 inline" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                </svg>
              </div>
            </div>

            {/* Songs List */}
            {playlist.songs.map((song, index) => {
              const isPlayingSong =
                currentSong?._id.toString() === song._id.toString() && isPlaying;

              return (
                <div
                  key={song._id.toString()}
                  onClick={() => handleSongClick(song)}
                  className="grid grid-cols-[16px_1fr_1fr_auto] md:grid-cols-[16px_1fr_1fr_1fr_auto] gap-4 px-4 py-2 rounded hover:bg-[#282828] group cursor-pointer"
                >
                  <div className="flex items-center text-gray-400 group-hover:text-white">
                    {isPlayingSong ? (
                      <svg
                        className="w-4 h-4 text-blue-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 3a1 1 0 00-1.447-.894L8.763 6H5a3 3 0 000 6h.28l1.771 5.316A1 1 0 008 18h1a1 1 0 001-1v-4.382l6.553 3.276A1 1 0 0018 15V3z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <span className="group-hover:hidden">{index + 1}</span>
                    )}
                    <button
                      className="hidden group-hover:block text-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSongClick(song);
                      }}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                  <div className="flex items-center gap-3 min-w-0">
                    {song.coverUrl && (
                      <img
                        src={song.coverUrl}
                        alt={song.title}
                        className="w-10 h-10 rounded object-cover hidden md:block"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <div
                        className={`text-sm font-medium truncate ${
                          isPlayingSong ? "text-blue-500" : "text-white"
                        }`}
                      >
                        {song.title}
                      </div>
                      <div className="text-sm text-gray-400 truncate">
                        {song.artist}
                      </div>
                    </div>
                  </div>
                  <div className="hidden md:flex items-center text-sm text-gray-400">
                    {song.category}
                  </div>
                  <div className="hidden md:flex items-center text-sm text-gray-400">
                    {new Date().toLocaleDateString()}
                  </div>
                  <div className="flex items-center justify-end text-sm text-gray-400">
                    {formatDuration(song.duration)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
