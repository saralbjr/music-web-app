"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import SongCard from "@/components/SongCard";
import { ISong } from "@/models/Song";

const categories = [
  {
    name: "Pop",
    color: "bg-gradient-to-br from-pink-500 to-pink-700",
    image:
      "https://images.unsplash.com/photo-1470229538611-16ba8c7ffbd7?w=400&auto=format&fit=crop&q=60",
  },
  {
    name: "Rock",
    color: "bg-gradient-to-br from-red-500 to-red-700",
    image:
      "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400&auto=format&fit=crop&q=60",
  },
  {
    name: "Hip Hop",
    color: "bg-gradient-to-br from-purple-500 to-purple-700",
    image:
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&auto=format&fit=crop&q=60",
  },
  {
    name: "Jazz",
    color: "bg-gradient-to-br from-blue-500 to-blue-700",
    image:
      "https://images.unsplash.com/photo-1485579149621-3123dd979885?w=400&auto=format&fit=crop&q=60",
  },
  {
    name: "Electronic",
    color: "bg-gradient-to-br from-green-500 to-green-700",
    image:
      "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=400&auto=format&fit=crop&q=60",
  },
  {
    name: "Classical",
    color: "bg-gradient-to-br from-yellow-500 to-yellow-600",
    image:
      "https://images.unsplash.com/photo-1485579149621-3123dd979885?w=400&auto=format&fit=crop&q=60",
  },
  {
    name: "Country",
    color: "bg-gradient-to-br from-orange-500 to-orange-700",
    image:
      "https://images.unsplash.com/photo-1507878866276-a947ef722fee?w=400&auto=format&fit=crop&q=60",
  },
  {
    name: "R&B",
    color: "bg-gradient-to-br from-indigo-500 to-indigo-700",
    image:
      "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400&auto=format&fit=crop&q=60",
  },
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
                className={`${category.color} relative rounded-lg p-6 text-left overflow-hidden hover:scale-105 transition-transform transform aspect-square flex items-end shadow-lg hover:shadow-xl`}
              >
                <span className="text-xl font-bold text-white drop-shadow">
                  {category.name}
                </span>
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute -bottom-6 -right-4 rotate-12 w-28 h-28 opacity-80">
                    <Image
                      src={category.image}
                      alt={`${category.name} album art`}
                      width={160}
                      height={160}
                      className="w-full h-full object-cover rounded-lg shadow-2xl"
                      priority={false}
                    />
                  </div>
                </div>
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
              {songs.map((song) => {
                const songId = String(song._id);
                return <SongCard key={songId} song={song} queue={songs} />;
              })}
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
