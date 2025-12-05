"use client";

import { useEffect, useState } from "react";
import SongCard from "@/components/SongCard";
import { ISong } from "@/models/Song";

/**
 * All Songs Page
 * Display all available songs in a grid layout
 */
export default function AllSongsPage() {
  const [songs, setSongs] = useState<ISong[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"title" | "artist" | "playCount">("title");
  const [order, setOrder] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    fetchSongs();
  }, [sortBy, order]);

  const fetchSongs = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/songs?sortBy=${sortBy}&order=${order}`
      );
      const data = await response.json();
      if (data.success) {
        setSongs(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching songs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSortChange = (newSortBy: "title" | "artist" | "playCount") => {
    if (sortBy === newSortBy) {
      setOrder(order === "asc" ? "desc" : "asc");
    } else {
      setSortBy(newSortBy);
      setOrder("asc");
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-[#282828] rounded w-64"></div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {[...Array(12)].map((_, i) => (
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
        <h1 className="text-3xl font-bold">All Songs</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">Sort by:</span>
          <div className="flex gap-2">
            <button
              onClick={() => handleSortChange("title")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                sortBy === "title"
                  ? "bg-white text-black"
                  : "bg-[#282828] text-white hover:bg-[#333]"
              }`}
            >
              Title {sortBy === "title" && (order === "asc" ? "↑" : "↓")}
            </button>
            <button
              onClick={() => handleSortChange("artist")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                sortBy === "artist"
                  ? "bg-white text-black"
                  : "bg-[#282828] text-white hover:bg-[#333]"
              }`}
            >
              Artist {sortBy === "artist" && (order === "asc" ? "↑" : "↓")}
            </button>
            <button
              onClick={() => handleSortChange("playCount")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                sortBy === "playCount"
                  ? "bg-white text-black"
                  : "bg-[#282828] text-white hover:bg-[#333]"
              }`}
            >
              Popular {sortBy === "playCount" && (order === "asc" ? "↑" : "↓")}
            </button>
          </div>
        </div>
      </div>

      {songs.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {songs.map((song) => (
            <SongCard key={song._id.toString()} song={song} queue={songs} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-400 mb-4">No songs available</p>
        </div>
      )}
    </div>
  );
}

