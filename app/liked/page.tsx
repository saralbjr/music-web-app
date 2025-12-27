"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ISong } from "@/models/Song";
import { useAudioStore } from "@/lib/store/audioStore";
import { useToast } from "@/components/ToastProvider";
import { mergeSort } from "@/lib/algorithms/mergeSort";

/**
 * Liked Songs Page
 * Dedicated page for user's liked songs in list format
 */
export default function LikedSongsPage() {
  const router = useRouter();
  const { setCurrentSong, currentSong, isPlaying } = useAudioStore();
  const [likedSongs, setLikedSongs] = useState<ISong[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSongMenuId, setShowSongMenuId] = useState<string | null>(null);
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
        // Refresh list after removing from favorites
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

  // Refresh liked songs when a song is liked/unliked
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
    added: "Recently added",
    title: "Title (A–Z)",
    artist: "Artist (A–Z)",
    duration: "Duration (shortest)",
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-[#282828] rounded w-64"></div>
          <div className="space-y-2">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-14 bg-[#282828] rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 pb-32">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Favorites</h1>
        <p className="text-gray-400 text-sm">
          {likedSongs.length} {likedSongs.length === 1 ? "song" : "songs"}
        </p>
      </div>

      {likedSongs.length > 0 ? (
        <div className="space-y-1">
          {/* Sort bar */}
          <div className="flex items-center justify-end px-4 pt-2 pb-1">
            <div className="relative">
              <button
                type="button"
                onClick={() => setSortMenuOpen((prev) => !prev)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-xs text-gray-200 border border-white/10"
              >
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3 5a1 1 0 011-1h9a1 1 0 110 2H7a1 1 0 01-1-1zm4 4a1 1 0 011-1h5a1 1 0 110 2h-5a1 1 0 01-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="uppercase tracking-wide text-[10px] text-gray-400">
                  Sort by
                </span>
                <span className="text-xs font-medium">
                  {sortLabel[sortOption]}
                </span>
              </button>
              {sortMenuOpen && (
                <div className="absolute right-0 mt-2 w-52 rounded-xl bg-[#181818] border border-white/10 shadow-xl text-xs text-gray-200 py-1 z-[55]">
                  {(Object.keys(sortLabel) as Array<
                    "added" | "title" | "artist" | "duration"
                  >).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => {
                        setSortOption(option);
                        setSortMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 hover:bg-white/10 ${
                        sortOption === option ? "text-white" : ""
                      }`}
                    >
                      <span>{sortLabel[option]}</span>
                      {sortOption === option && (
                        <span className="text-blue-400 text-[10px]">●</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Header row */}
          <div className="grid grid-cols-[16px_1fr_auto] md:grid-cols-[40px_minmax(0,3fr)_minmax(0,2fr)_auto] gap-4 px-4 py-3 text-xs text-gray-400 border-b border-[#282828] bg-[#121212]/95 backdrop-blur sticky top-16 z-10 rounded-t-lg">
            <div>#</div>
            <div>Title</div>
            <div className="hidden md:block">Artist</div>
            <div className="text-right">Duration</div>
          </div>

          {/* Rows */}
          {sortedLikedSongs.map((song, index) => {
            const songId = ensureSongId(song._id);
            const isPlayingSong =
              currentSongId !== null && currentSongId === songId && isPlaying;

            return (
              <div
                key={songId}
                onClick={() => handleSongClick(song)}
                className="grid grid-cols-[16px_1fr_auto] md:grid-cols-[40px_minmax(0,3fr)_minmax(0,2fr)_auto] gap-4 px-4 py-3 rounded hover:bg-white/5 cursor-pointer transition group"
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
                    <span>{index + 1}</span>
                  )}
                </div>
                <div className="flex items-center gap-3 min-w-0">
                  {song.coverFile ? (
                    <img
                      src={song.coverFile}
                      alt={song.title}
                      className="w-12 h-12 rounded object-cover hidden md:block"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded bg-white/5 hidden md:flex items-center justify-center text-white/40 text-xs">
                      No art
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div
                      className={`text-base font-medium truncate ${
                        isPlayingSong ? "text-blue-400" : "text-white"
                      }`}
                    >
                      {song.title}
                    </div>
                    <div className="text-sm text-gray-400 truncate md:hidden">
                      {song.artist}
                    </div>
                  </div>
                </div>
                <div className="hidden md:flex items-center text-sm text-gray-400 truncate">
                  {song.artist}
                </div>
                <div className="flex items-center justify-end text-sm text-gray-400 tabular-nums gap-2">
                  <span>{formatDuration(song.duration)}</span>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowSongMenuId((current) =>
                          current === songId ? null : songId
                        );
                        if (!menuPlaylistsLoaded) {
                          fetchUserPlaylists();
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-white/60 hover:text-white p-1 rounded-full hover:bg-white/10"
                      aria-label="Song options"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zm6 0a2 2 0 11-4 0 2 2 0 014 0zm2 2a2 2 0 100-4 2 2 0 000 4z" />
                      </svg>
                    </button>

                    {showSongMenuId === songId && (
                      <div className="absolute right-0 top-8 z-[60] w-56 bg-[#282828] rounded-xl shadow-xl border border-white/10 py-1 text-sm">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleFavorite(songId);
                            setShowSongMenuId(null);
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-white/10 text-red-400"
                        >
                          Remove from Favorites
                        </button>
                        <div className="border-t border-white/10 my-1" />
                        <div className="px-3 py-1 text-xs uppercase tracking-wide text-white/40">
                          Add to playlist
                        </div>
                        <div className="max-h-48 overflow-y-auto">
                          {menuPlaylists.length === 0 ? (
                            <div className="px-3 py-2 text-white/60 text-xs">
                              No playlists
                            </div>
                          ) : (
                            menuPlaylists.map((p) => {
                              const existingIds = Array.isArray(p.songs)
                                ? p.songs.map((s) =>
                                    ensureSongId(
                                      typeof s === "string" ? s : s._id
                                    )
                                  )
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
                                      const nextIds = Array.from(
                                        new Set([...existingIds, songId])
                                      ).filter(Boolean);
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
                                        showToast(
                                          `Added to "${p.name}"`,
                                          "success"
                                        );
                                      } else {
                                        showToast(
                                          updated.error ||
                                            "Failed to add to playlist",
                                          "error"
                                        );
                                      }
                                    } catch (error) {
                                      console.error(
                                        "Error adding favorite song to playlist:",
                                        error
                                      );
                                    } finally {
                                      setShowSongMenuId(null);
                                    }
                                  }}
                                  className={`w-full text-left px-3 py-2 hover:bg-white/10 text-white/90 ${
                                    alreadyIn
                                      ? "opacity-50 cursor-not-allowed"
                                      : ""
                                  }`}
                                >
                                  {alreadyIn ? `In ${p.name}` : p.name}
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-400 mb-4">No favorites yet</p>
          <p className="text-gray-500 text-sm">Like songs to see them here</p>
        </div>
      )}
    </div>
  );
}
