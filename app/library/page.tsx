"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PlaylistCard from "@/components/PlaylistCard";
import SongCard from "@/components/SongCard";
import { ISong } from "@/models/Song";

/**
 * Spotify-style Library Page
 * User's playlists and liked songs
 */
export default function LibraryPage() {
  const router = useRouter();
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [songs, setSongs] = useState<ISong[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"playlists" | "songs">("playlists");

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

      // Fetch all songs
      const songsResponse = await fetch("/api/songs");
      const songsData = await songsResponse.json();
      if (songsData.success) {
        setSongs(songsData.data || []);
      }
    } catch (error) {
      console.error("Error fetching library:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-[#282828] rounded w-64"></div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-48 bg-[#282828] rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 pb-32">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-6">Your Library</h1>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-[#282828] mb-6">
          <button
            onClick={() => setActiveTab("playlists")}
            className={`pb-2 px-1 font-semibold text-sm border-b-2 transition-colors ${
              activeTab === "playlists"
                ? "border-white text-white"
                : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            Playlists
          </button>
          <button
            onClick={() => setActiveTab("songs")}
            className={`pb-2 px-1 font-semibold text-sm border-b-2 transition-colors ${
              activeTab === "songs"
                ? "border-white text-white"
                : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            Songs
          </button>
        </div>
      </div>

      {activeTab === "playlists" ? (
        <>
          {playlists.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {playlists.map((playlist) => (
                <PlaylistCard key={playlist._id} playlist={playlist} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-400 mb-4">No playlists yet</p>
              <button
                onClick={() => router.push("/playlists")}
                className="px-6 py-2 bg-white text-black rounded-full text-sm font-semibold hover:scale-105 transition-transform"
              >
                Create Playlist
              </button>
            </div>
          )}
        </>
      ) : (
        <>
          {songs.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {songs.map((song) => (
                <SongCard key={song._id.toString()} song={song} queue={songs} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-400">No songs in library</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}







