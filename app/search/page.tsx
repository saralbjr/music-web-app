"use client";

import Image from "next/image";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import SongCard from "@/components/SongCard";
import { ISong } from "@/models/Song";

// Curated categories with high-quality aesthetics
const categories = [
  {
    name: "Pop",
    color: "from-blue-500/80 to-cyan-600/80",
    image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=870&auto=format&fit=crop&q=80",
    span: "col-span-1 md:col-span-2 row-span-2", // Large featured card
  },
  {
    name: "Rock",
    color: "from-indigo-600/80 to-blue-700/80",
    image: "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=800&auto=format&fit=crop&q=80",
    span: "col-span-1 row-span-1",
  },
  {
    name: "Hip Hop",
    color: "from-purple-600/80 to-indigo-800/80",
    image: "https://images.unsplash.com/photo-1571609549239-bf07fb79f702?w=800&auto=format&fit=crop&q=80",
    span: "col-span-1 row-span-1",
  },
  {
    name: "Jazz",
    color: "from-sky-600/80 to-blue-700/80",
    image: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=800&auto=format&fit=crop&q=80",
    span: "col-span-1 md:col-span-2 row-span-1", // Wide card
  },
  {
    name: "Electronic",
    color: "from-cyan-500/80 to-teal-700/80",
    image: "https://images.unsplash.com/photo-1581974944026-5d6ed762f617?q=80&w=870&auto=format&fit=crop&q=80",
    span: "col-span-1 row-span-1",
  },
  {
    name: "Classical",
    color: "from-blue-500/80 to-slate-600/80",
    image: "https://images.unsplash.com/photo-1680594517393-45fc17e31743?q=80&w=388&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    span: "col-span-1 row-span-1",
  },
  {
    name: "Country",
    color: "from-teal-600/80 to-emerald-700/80",
    image: "https://images.unsplash.com/photo-1482442120256-9c03866de390?w=800&auto=format&fit=crop&q=80",
    span: "col-span-1 row-span-1",
  },
  {
    name: "R&B",
    color: "from-violet-600/80 to-purple-700/80",
    image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&auto=format&fit=crop&q=80",
    span: "col-span-1 row-span-1",
  },
  {
    name: "Indie",
    color: "from-indigo-500/80 to-violet-700/80",
    image: "https://images.unsplash.com/photo-1677957855684-866bda07805e?q=80&w=870&auto=format&fit=crop&q=80",
    span: "col-span-1 md:col-span-2 row-span-1", // Wide card
  },
];

const LoadingSkeleton = () => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
    {[...Array(10)].map((_, i) => (
      <div
        key={i}
        className="bg-[#181818] rounded-lg p-4 animate-pulse flex flex-col gap-3"
      >
        <div className="aspect-square bg-white/5 rounded-lg w-full" />
        <div className="h-4 bg-white/10 rounded w-3/4" />
        <div className="h-3 bg-white/5 rounded w-1/2" />
      </div>
    ))}
  </div>
);

const SearchPageSkeleton = () => (
  <div className="min-h-screen bg-black/50 p-6 md:p-10 pb-32">
    <div className="max-w-7xl mx-auto space-y-10">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 animate-pulse">
        <div className="space-y-4">
          <div className="h-14 w-64 bg-white/10 rounded-lg" />
          <div className="h-6 w-96 bg-white/5 rounded-lg" />
        </div>
      </div>
      {/* Grid Skeleton */}
      <LoadingSkeleton />
    </div>
  </div>
);

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get("q") || "";
  const [songs, setSongs] = useState<ISong[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Update state whenever URL query changes
  useEffect(() => {
    if (query) {
      performSearch(query);
    } else {
      setSongs([]);
    }
  }, [query]);

  // Handle category selection
  const handleCategoryClick = async (category: string) => {
    if (selectedCategory === category) {
      setSelectedCategory(null);
      setSongs([]);
      return;
    }

    setSelectedCategory(category);
    setLoading(true);
    try {
      const response = await fetch(
        `/api/songs?category=${encodeURIComponent(category)}&limit=50`
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

  const performSearch = async (searchQuery: string) => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/songs?search=${encodeURIComponent(searchQuery)}&limit=50`
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

  const clearFilters = () => {
    setSelectedCategory(null);
    setSongs([]);
    if (query) router.push("/search");
  };

  const isSearching = !!query || !!selectedCategory;

  return (
    <div className="min-h-screen bg-black/50 text-white p-6 md:p-10 pb-32">
      <div className="max-w-7xl mx-auto space-y-10">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-5xl md:text-6xl font-black tracking-tighter bg-gradient-to-r from-white via-blue-100 to-blue-200 bg-clip-text text-transparent">
              {selectedCategory ? selectedCategory : "Explore"}
            </h1>
            <p className="text-lg text-gray-400 font-medium">
              {isSearching
                ? `Found ${songs.length} tracks`
                : "Discover new music, genres, and vibes."}
            </p>
          </div>

          {isSearching && (
            <button
              onClick={clearFilters}
              className="px-6 py-2.5 bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white/90 rounded-full text-sm font-semibold transition-all border border-white/10 hover:border-white/20 flex items-center gap-2 group"
            >
              <span>Clear filters</span>
              <svg className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

      {/* Content Area */}
        <div className="relative">
          {!isSearching ? (
            /* Browse All Genres - Masonry Grid */
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 auto-rows-[180px]">
              {categories.map((category) => (
                <button
                  key={category.name}
                  onClick={() => handleCategoryClick(category.name)}
                  className={`
                    ${category.span}
                    relative group overflow-hidden rounded-3xl cursor-pointer
                    focus:outline-none focus:ring-4 focus:ring-blue-500/30
                    transition-all duration-500 hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)]
                    hover:z-10 hover:scale-[1.02]
                  `}
                >
                  {/* Background Image */}
                  <div className="absolute inset-0">
                    <Image
                      src={category.image}
                      alt={category.name}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                      sizes="(max-width: 768px) 50vw, 33vw"
                    />
                  </div>

                  {/* Gradient Overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-60 mix-blend-multiply group-hover:opacity-70 transition-opacity duration-300`} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />

                  {/* Content */}
                  <div className="absolute inset-0 p-6 flex flex-col justify-end items-start">
                    <h3 className="text-3xl font-black text-white tracking-tight transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                      {category.name}
                    </h3>
                    <div className="overflow-hidden h-0 group-hover:h-8 transition-all duration-300">
                      <p className="text-sm font-medium text-white/80 mt-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75">
                        Browse {category.name}
                      </p>
                    </div>
                  </div>

                  {/* Hover Icon */}
                  <div className="absolute top-4 right-4 text-white opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                    <svg className="w-8 h-8 drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            /* Search Results */
            <div className="animate-fade-in">
              {loading ? (
                <LoadingSkeleton />
              ) : songs.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {songs.map((song) => (
                    <div key={String(song._id || song.id)} className="w-full">
                      <SongCard
                        song={song}
                        queue={songs}
                        showLikeButton={true}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <div className="w-24 h-24 bg-[#1a1a1a] rounded-full flex items-center justify-center mb-6">
                    <svg className="w-10 h-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">No matches found</h3>
                  <p className="text-gray-400 max-w-md mx-auto">
                    We couldn&apos;t find any songs matching &quot;{query || selectedCategory}&quot;. Try adjusting your search keywords or browsing a different category.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchPageSkeleton />}>
      <SearchPageContent />
    </Suspense>
  );
}
