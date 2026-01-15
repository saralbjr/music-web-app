"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PlaylistCard from "@/components/PlaylistCard";
import SongCard from "@/components/SongCard";
import { ISong } from "@/models/Song";

/**
 * Library Page Content Component
 */
function LibraryPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  interface Playlist {
    _id: string;
    name: string;
    songs: string[] | ISong[];
    coverUrl?: string;
  }
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [likedSongs, setLikedSongs] = useState<ISong[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"playlists" | "liked">(
    searchParams.get("tab") === "liked" ? "liked" : "playlists"
  );

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

    fetchData(user.id, token);
  }, [router]);

  // Update active tab when URL parameter changes
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "liked") {
      setActiveTab("liked");
    } else {
      setActiveTab("playlists");
    }
  }, [searchParams]);

  const fetchData = async (userId: string, token: string) => {
    try {
      const playlistsResponse = await fetch(`/api/playlists?userId=${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const playlistsData = await playlistsResponse.json();
      if (playlistsData.success) {
        setPlaylists(playlistsData.data || []);
      }

      // Fetch liked songs
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
      console.error("Error fetching library:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 pb-32 min-h-screen bg-black/90">
        <div className="animate-pulse space-y-10">
          <div className="h-12 bg-[#1a1a1a] rounded-lg w-48"></div>
          <div className="flex gap-4">
            <div className="h-10 bg-[#1a1a1a] rounded-full w-24"></div>
            <div className="h-10 bg-[#1a1a1a] rounded-full w-24"></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-64 bg-[#1a1a1a] rounded-xl border border-white/5"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8 pb-32">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col gap-6">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
            Your Library
          </h1>

          {/* Modern Tabs */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setActiveTab("playlists");
                router.push("/library");
              }}
              className={`
                px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300
                ${activeTab === "playlists"
                  ? "bg-white text-black scale-105 shadow-lg shadow-white/10"
                  : "bg-[#1a1a1a] text-gray-400 hover:text-white hover:bg-[#2a2a2a]"
                }
              `}
            >
              Playlists
            </button>
            <button
              onClick={() => {
                setActiveTab("liked");
                router.push("/library?tab=liked");
              }}
              className={`
                px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300
                ${activeTab === "liked"
                  ? "bg-white text-black scale-105 shadow-lg shadow-white/10"
                  : "bg-[#1a1a1a] text-gray-400 hover:text-white hover:bg-[#2a2a2a]"
                }
              `}
            >
              Favorites
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="animate-fade-in transition-all duration-500">
          {activeTab === "playlists" ? (
            playlists.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {playlists.map((playlist) => (
                  <div key={playlist._id} className="transform hover:scale-[1.02] transition-transform duration-300">
                    <PlaylistCard
                      playlist={{
                        _id: playlist._id,
                        name: playlist.name,
                        songs: Array.isArray(playlist.songs) && playlist.songs.length > 0 && typeof playlist.songs[0] === 'object'
                          ? playlist.songs as ISong[]
                          : undefined,
                        coverUrl: playlist.coverUrl,
                      }}
                    />
                  </div>
                ))}

                {/* Add New Playlist Card */}
                <button
                  onClick={() => router.push("/playlists")}
                  className="group relative aspect-square rounded-xl bg-[#1a1a1a] border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-4 hover:border-white/30 hover:bg-[#222] transition-all duration-300"
                >
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-8 h-8 text-gray-400 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <span className="font-semibold text-gray-400 group-hover:text-white">Create Playlist</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 bg-[#121212] rounded-3xl border border-white/5">
                <div className="w-20 h-20 bg-[#1a1a1a] rounded-full flex items-center justify-center mb-6 animate-pulse-subtle">
                   <svg className="w-10 h-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                   </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Your library looks empty</h3>
                <p className="text-gray-400 mb-8 max-w-sm text-center">Create your first playlist and start collecting your favorite tracks.</p>
                <button
                  onClick={() => router.push("/playlists")}
                  className="px-8 py-3 bg-white text-black rounded-full font-bold hover:scale-105 transition-transform shadow-lg shadow-white/10"
                >
                  Create Playlist
                </button>
              </div>
            )
          ) : (
            likedSongs.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                {likedSongs.map((song) => (
                  <div key={String(song._id || song.id)} className="w-full">
                    <SongCard
                      song={song}
                      queue={likedSongs}
                      showLikeButton={true}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 bg-[#121212] rounded-3xl border border-white/5">
                <div className="w-20 h-20 bg-[#1a1a1a] rounded-full flex items-center justify-center mb-6">
                  <svg className="w-10 h-10 text-red-500/50" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No favorites yet</h3>
                <p className="text-gray-400 text-center max-w-sm">
                  Tap the heart icon on any song to save it here for easy access.
                </p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Spotify-style Library Page
 * User's playlists and liked songs
 */
export default function LibraryPage() {
  return (
    <Suspense fallback={
       <div className="min-h-screen bg-black flex items-center justify-center">
         <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
       </div>
    }>
      <LibraryPageContent />
    </Suspense>
  );
}







