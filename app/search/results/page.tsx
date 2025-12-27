"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import SongCard from "@/components/SongCard";
import { ISong } from "@/models/Song";

/**
 * Search Results Page
 * Shows all search results for a query
 */
export default function SearchResultsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get("q") || "";
  const [songs, setSongs] = useState<ISong[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (query) {
      performSearch(query);
    } else {
      router.push("/search");
    }
  }, [query, router]);

  const performSearch = async (searchQuery: string) => {
    setLoading(true);
    try {
      // Check if it's a category search (common category names)
      const categories = ["Pop", "Rock", "Hip Hop", "Jazz", "Electronic", "Classical", "Country", "R&B"];
      const isCategory = categories.some(cat => cat.toLowerCase() === searchQuery.toLowerCase());

      const url = isCategory
        ? `/api/songs?category=${encodeURIComponent(searchQuery)}&limit=1000`
        : `/api/songs?search=${encodeURIComponent(searchQuery)}&limit=1000`;

      const response = await fetch(url);
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

  if (loading) {
    return (
      <div className="p-8 pb-32">
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
        <button
          onClick={() => router.back()}
          className="mb-4 text-gray-400 hover:text-white transition-colors flex items-center gap-2"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back
        </button>
        <h1 className="text-3xl font-bold mb-2">
          Search results for &quot;{query}&quot;
        </h1>
        <p className="text-gray-400 text-sm">
          {songs.length} {songs.length === 1 ? "result" : "results"} found
        </p>
      </div>

      {songs.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {songs.map((song) => (
            <SongCard
              key={String(song._id || song.id)}
              song={song}
              queue={songs}
              showLikeButton={true}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg mb-2">No results found</p>
          <p className="text-gray-500 text-sm">
            Try searching with different keywords
          </p>
        </div>
      )}
    </div>
  );
}

