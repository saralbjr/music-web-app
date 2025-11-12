"use client";

import { useEffect, useState } from "react";
import SongCard from "@/components/SongCard";
import { ISong } from "@/models/Song";

/**
 * Discover Page
 * Browse and play songs from external APIs
 */
export default function DiscoverPage() {
  const [songs, setSongs] = useState<ISong[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchPopularSongs();
  }, []);

  const fetchPopularSongs = async () => {
    setLoading(true);
    try {
      // Fetch trending songs from Deezer
      const trendingResponse = await fetch("/api/songs/trending?limit=100");
      const trendingData = await trendingResponse.json();

      if (trendingData.success && trendingData.songs) {
        // Convert to ISong format
        const convertedSongs = trendingData.songs.map((song: any) => ({
          _id: song.id,
          title: song.title,
          artist: song.artist,
          duration: song.duration,
          audioUrl: song.audio,
          coverUrl: song.cover,
          category: song.genre || "Unknown",
          playCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        }));
        setSongs(convertedSongs);
      } else {
        setSongs([]);
      }
    } catch (error) {
      console.error("Error fetching trending songs:", error);
      setSongs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      fetchPopularSongs();
      return;
    }

    setLoading(true);
    try {
      // Search both Deezer and iTunes
      const searchResponse = await fetch(
        `/api/songs/search?q=${encodeURIComponent(searchTerm)}&limit=100`
      );
      const searchData = await searchResponse.json();

      if (searchData.success && searchData.songs) {
        // Convert to ISong format
        const convertedSongs = searchData.songs.map((song: any) => ({
          _id: song.id,
          title: song.title,
          artist: song.artist,
          duration: song.duration,
          audioUrl: song.audio,
          coverUrl: song.cover,
          category: song.genre || "Unknown",
          playCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        }));
        setSongs(convertedSongs);
      } else {
        setSongs([]);
      }
    } catch (error) {
      console.error("Error searching songs:", error);
      setSongs([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 pb-32">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-6">Discover Music</h1>

        {/* Search Bar */}
        <div className="flex gap-4 mb-6">
          <input
            type="text"
            placeholder="Search for songs, artists..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            className="flex-1 px-4 py-2 bg-[#282828] text-white rounded-lg border border-[#404040] focus:border-blue-500 focus:outline-none"
          />
          <button
            onClick={handleSearch}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition-colors"
          >
            Search
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse bg-[#181818] rounded-lg h-64"
            ></div>
          ))}
        </div>
      ) : songs.length > 0 ? (
        <>
          <div className="mb-4">
            <p className="text-gray-400">
              Found {songs.length} playable songs
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {songs.map((song) => (
              <SongCard key={song._id.toString()} song={song} queue={songs} />
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-400">
            {searchTerm
              ? "No songs found. Try a different search term."
              : "Start searching to discover music!"}
          </p>
        </div>
      )}
    </div>
  );
}

