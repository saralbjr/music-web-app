"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import SongCard from "@/components/SongCard";
import { ISong } from "@/models/Song";

const categories = [
  { name: "Pop", color: "bg-pink-500" },
  { name: "Rock", color: "bg-red-500" },
  { name: "Hip Hop", color: "bg-purple-500" },
  { name: "Jazz", color: "bg-blue-500" },
  { name: "Electronic", color: "bg-green-500" },
  { name: "Classical", color: "bg-yellow-500" },
  { name: "Country", color: "bg-orange-500" },
  { name: "R&B", color: "bg-indigo-500" },
];

/**
 * Spotify-style Search Page
 * Category tiles and search results
 */
export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const [songs, setSongs] = useState<ISong[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    if (query) {
      performSearch(query);
    } else {
      setSongs([]);
    }
  }, [query]);

  const performSearch = async (searchQuery: string) => {
    setLoading(true);
    try {
      // Search local songs
      const response = await fetch(
        `/api/songs?search=${encodeURIComponent(searchQuery)}&limit=100`
      );
      const data = await response.json();
      if (data.success && data.data) {
        setSongs(data.data);
      } else {
        setSongs([]);
      }
    } catch (error) {
      console.error("Error searching:", error);
      setSongs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = async (category: string) => {
    setSelectedCategory(category);
    setLoading(true);
    try {
      // Search local songs by category
      const response = await fetch(
        `/api/songs?category=${encodeURIComponent(category)}&limit=100`
      );
      const data = await response.json();
      if (data.success && data.data) {
        setSongs(data.data);
      } else {
        setSongs([]);
      }
    } catch (error) {
      console.error("Error searching:", error);
      setSongs([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 pb-32">
      {!query && !selectedCategory ? (
        <>
          {/* Category Tiles */}
          <h1 className="text-2xl font-bold mb-6">Browse all</h1>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {categories.map((category, index) => (
              <button
                key={category.name}
                onClick={() => handleCategoryClick(category.name)}
                className={`${category.color} rounded-lg p-6 text-left hover:scale-105 transition-transform transform aspect-square flex items-end shadow-lg hover:shadow-xl`}
              >
                <span className="text-xl font-bold text-white">
                  {category.name}
                </span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          {/* Search Results */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2">
              {selectedCategory
                ? `Search results for "${selectedCategory}"`
                : query
                ? `Search results for "${query}"`
                : "Search"}
            </h1>
            {selectedCategory && (
              <button
                onClick={() => {
                  setSelectedCategory(null);
                  setSongs([]);
                }}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Clear filter
              </button>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse bg-[#181818] rounded-lg h-64"
                ></div>
              ))}
            </div>
          ) : songs.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {songs.map((song) => (
                <SongCard key={song._id.toString()} song={song} queue={songs} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg">
                {query || selectedCategory
                  ? "No results found"
                  : "Start searching to see results"}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}


