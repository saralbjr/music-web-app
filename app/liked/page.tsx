"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SongCard from "@/components/SongCard";
import { ISong } from "@/models/Song";

/**
 * Liked Songs Page
 * Dedicated page for user's liked songs
 */
export default function LikedSongsPage() {
  const router = useRouter();
  const [likedSongs, setLikedSongs] = useState<ISong[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-[#282828] rounded w-64"></div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="h-64 bg-[#282828] rounded"></div>
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {likedSongs.map((song) => (
            <SongCard
              key={song._id.toString()}
              song={song}
              queue={likedSongs}
              showLikeButton={true}
            />
          ))}
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
