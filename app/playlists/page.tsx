"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PlaylistCard from "@/components/PlaylistCard";

interface Playlist {
  _id: string;
  name: string;
  songs: any[];
}

/**
 * Spotify-style Playlists Page
 * Display and manage playlists
 */
export default function PlaylistsPage() {
  const router = useRouter();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (!user) {
      router.push("/auth/login");
      return;
    }

    fetchPlaylists();
  }, [router]);

  const fetchPlaylists = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      if (!user.id) return;

      const response = await fetch(`/api/playlists?userId=${user.id}`);
      const data = await response.json();

      if (data.success) {
        setPlaylists(data.data);
      }
    } catch (error) {
      console.error("Error fetching playlists:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      if (!user.id) return;

      const response = await fetch("/api/playlists", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newPlaylistName,
          userId: user.id,
          songs: [],
        }),
      });

      const data = await response.json();
      if (data.success) {
        setNewPlaylistName("");
        setShowCreateForm(false);
        fetchPlaylists();
      }
    } catch (error) {
      console.error("Error creating playlist:", error);
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
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">My Playlists</h1>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-6 py-2 bg-white text-black rounded-full text-sm font-semibold hover:scale-105 transition-transform"
        >
          {showCreateForm ? "Cancel" : "Create Playlist"}
        </button>
      </div>

      {showCreateForm && (
        <div className="bg-[#181818] rounded-lg p-6 mb-6">
          <form onSubmit={handleCreatePlaylist} className="space-y-4">
            <input
              type="text"
              placeholder="Playlist name"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              required
              className="w-full px-4 py-2 bg-[#282828] text-white rounded border border-[#404040] focus:border-blue-500 focus:outline-none"
            />
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full text-sm font-semibold transition-colors"
            >
              Create
            </button>
          </form>
        </div>
      )}

      {playlists.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400 mb-4">
            No playlists yet. Create one to get started!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {playlists.map((playlist) => (
            <PlaylistCard key={playlist._id} playlist={playlist} />
          ))}
        </div>
      )}
    </div>
  );
}
