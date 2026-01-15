/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useCallback } from "react";
import SongCard from "@/components/SongCard";
import PlaylistCard from "@/components/PlaylistCard";
import { ISong } from "@/models/Song";
import Link from "next/link";

/**
 * Revamped Home Page
 * - Blue/Cyan Theme
 * - Simplified Mood Selection
 * - Quick Access to Content
 */
export default function HomePage() {
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [trendingSongs, setTrendingSongs] = useState<ISong[]>([]);
  const [recommendedSongs, setRecommendedSongs] = useState<ISong[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedMood, setSelectedMood] = useState<string>("Happy");
  const [moodSongs, setMoodSongs] = useState<ISong[]>([]);
  const [loadingMood, setLoadingMood] = useState(false);

  const getSongId = (song: ISong) => {
    const rawId = (song as any)?._id;
    if (typeof rawId === "string") return rawId;
    if (rawId && typeof rawId.toString === "function") return rawId.toString();
    return String(rawId ?? "");
  };

  const getGreeting = useCallback(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  }, []);

  useEffect(() => {
    fetchData();
    fetchMoodSongs("Happy");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    try {
      const songsResponse = await fetch(
        "/api/songs?sortBy=playCount&order=desc"
      );
      const songsData = await songsResponse.json();
      const allSongs: ISong[] = songsData.success ? songsData.data || [] : [];

      setTrendingSongs(allSongs.slice(0, 10) || []);

      const user = localStorage.getItem("user");
      const token = localStorage.getItem("token");
      const hasAuth = !!user && !!token;
      setIsAuthenticated(hasAuth);

      if (hasAuth) {
        try {
          const recResponse = await fetch("/api/songs/recommend?limit=6", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (recResponse.ok) {
            const recData = await recResponse.json();
            if (recData.success && Array.isArray(recData.data)) {
              setRecommendedSongs(recData.data);
            }
          }
        } catch (error) {
          console.error("Error fetching recommendations:", error);
        }
      } else {
        setRecommendedSongs([]);
      }

      if (hasAuth) {
        const userData = JSON.parse(user);
        const playlistsResponse = await fetch(
          `/api/playlists?userId=${userData.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const playlistsData = await playlistsResponse.json();
        if (playlistsData.success) {
          setPlaylists(playlistsData.data || []);
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMoodSongs = async (mood: string) => {
    setLoadingMood(true);
    setSelectedMood(mood);

    try {
      const token = localStorage.getItem("token");
      const headers: Record<string, string> = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`/api/songs/mood?mood=${mood}&limit=12`, {
        headers,
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          setMoodSongs(data.data);
        }
      }
    } catch (error) {
      console.error("Error fetching mood songs:", error);
    } finally {
      setLoadingMood(false);
    }
  };

  const moods = [
    {
      name: "Happy",
      emoji: "☀️",
      color: "from-amber-400/20 to-orange-500/20",
      activeColor: "from-amber-500 to-orange-500",
      textColor: "text-amber-300"
    },
    {
      name: "Sad",
      emoji: "🌧️",
      color: "from-blue-400/20 to-indigo-600/20",
      activeColor: "from-blue-500 to-indigo-600",
      textColor: "text-blue-300"
    },
    {
      name: "Relaxed",
      emoji: "🍃",
      color: "from-emerald-400/20 to-teal-500/20",
      activeColor: "from-emerald-500 to-teal-500",
      textColor: "text-emerald-300"
    },
    {
      name: "Focused",
      emoji: "💡",
      color: "from-violet-500/20 to-purple-600/20",
      activeColor: "from-violet-500 to-purple-600",
      textColor: "text-violet-300"
    },
  ];

  if (loading) {
    return (
      <div className="p-6 md:p-8 min-h-screen">
        <div className="animate-pulse space-y-10 max-w-7xl mx-auto">
          {/* Compact Hero Skeleton */}
          <div className="flex items-center justify-between">
            <div className="space-y-3">
              <div className="h-10 bg-white/[0.05] rounded-xl w-64"></div>
              <div className="h-4 bg-white/[0.03] rounded w-48"></div>
            </div>
          </div>

          {/* Quick Picks Skeleton */}
          <div className="space-y-4">
            <div className="h-6 bg-white/[0.05] rounded-lg w-40"></div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="aspect-square bg-white/[0.03] rounded-xl"></div>
              ))}
            </div>
          </div>

          {/* Mood Section Skeleton */}
          <div className="space-y-4">
            <div className="h-6 bg-white/[0.05] rounded-lg w-56"></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-20 bg-white/[0.03] rounded-2xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32 text-white overflow-x-hidden">
      <div className="px-6 md:px-8 py-6 space-y-12 max-w-7xl mx-auto">

        {/* Compact Hero - Greeting + Quick Stats */}
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/60">
              {getGreeting()}
            </h1>
            <p className="text-white/50 mt-2 text-lg">
              Discover your favorite songs
            </p>
          </div>
          <div className="flex gap-3">
            {!isAuthenticated && (
              <Link
                href="/auth/login"
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-full text-sm font-semibold transition-all hover:scale-105 shadow-lg shadow-blue-500/20"
              >
                Sign In
              </Link>
            )}
          </div>
        </header>

        {/* Trending Now */}
        <section className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 bg-blue-500 rounded-full" />
              <h2 className="text-xl font-bold text-white">Trending Now</h2>
            </div>
            <Link
              href="/songs"
              className="text-sm text-white/50 hover:text-white transition-colors flex items-center gap-2 group"
            >
              See all
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
            {trendingSongs.length > 0 ? (
              trendingSongs.slice(0, 10).map((song, index) => (
                <div
                  key={getSongId(song)}
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <SongCard song={song} queue={trendingSongs} />
                </div>
              ))
            ) : (
              <p className="text-white/40 col-span-full py-10 text-center">No songs available</p>
            )}
          </div>
        </section>

        {/* Simplified Mood Section */}
        <section className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-6 bg-cyan-500 rounded-full" />
            <h2 className="text-xl font-bold text-white">Mood-based recommendation</h2>
          </div>

          {/* Simple Mood Pills */}
          <div className="flex flex-wrap gap-3 mb-8">
            {moods.map((mood) => {
              const isActive = selectedMood === mood.name;
              return (
                <button
                  key={mood.name}
                  onClick={() => fetchMoodSongs(mood.name)}
                  disabled={loadingMood}
                  className={`
                    px-6 py-3 rounded-full flex items-center gap-3 transition-all duration-300
                    ${isActive
                      ? `bg-gradient-to-r ${mood.activeColor} text-white shadow-lg scale-105`
                      : 'bg-white/[0.05] hover:bg-white/[0.1] text-white/70 hover:text-white border border-white/5 hover:border-white/10'
                    }
                  `}
                >
                  <span className="text-lg">{mood.emoji}</span>
                  <span className="font-semibold text-sm tracking-wide">{mood.name}</span>
                </button>
              );
            })}
          </div>

          {/* Results Grid - Simple & Clean */}
          <div className="transition-all duration-500 min-h-[200px]">
            {loadingMood ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="aspect-square bg-white/[0.03] rounded-xl animate-pulse" />
                ))}
              </div>
            ) : moodSongs.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
                {moodSongs.slice(0, 6).map((song, index) => (
                  <div
                    key={getSongId(song)}
                    className="transform hover:-translate-y-1 transition-all duration-300 animate-fade-in-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <SongCard song={song} queue={moodSongs} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center text-white/40 bg-white/[0.02] rounded-2xl border border-white/5">
                <p>No tracks found for this mood yet.</p>
              </div>
            )}
          </div>
        </section>

        {/* Recommended For You */}
        {isAuthenticated && (
          <section className="animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-1 h-6 bg-blue-500 rounded-full" />
                <h2 className="text-xl font-bold text-white">Popularity-based Recommendation</h2>
              </div>
            </div>

            {recommendedSongs.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-5">
                {recommendedSongs.map((song, index) => (
                  <div
                    key={getSongId(song)}
                    className="animate-fade-in-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <SongCard song={song} queue={recommendedSongs} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border border-white/[0.06] p-8">
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="max-w-lg">
                    <h3 className="text-2xl font-bold mb-3 text-white">
                      Your Taste Profile is Building
                    </h3>
                    <p className="text-white/50 leading-relaxed text-sm">
                      Our recommendation engine learns from your listening patterns. Play more tracks and like your favorites to unlock personalized suggestions.
                    </p>
                  </div>
                  <Link href="/songs" className="shrink-0 inline-flex items-center gap-2 px-6 py-3 bg-white text-black font-semibold rounded-full hover:scale-105 transition-transform text-sm">
                    Explore Music
                  </Link>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Sign In CTA for non-authenticated users */}
        {!isAuthenticated && (
          <section className="animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            <div className="rounded-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-900/60 via-indigo-900/50 to-blue-900/60" />
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800')] bg-cover bg-center opacity-20" />

              <div className="relative z-10 p-8 md:p-12 flex flex-col items-center text-center space-y-5">
                <h3 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                  Unlock Your Personal Music Experience
                </h3>
                <p className="text-white/60 max-w-xl">
                  Sign in to get AI-powered recommendations, create playlists, and save your favorite tracks.
                </p>
                <div className="flex gap-4 pt-2">
                  <Link
                    href="/auth/login"
                    className="px-8 py-3 bg-white text-black font-semibold rounded-full hover:scale-105 transition-transform text-sm"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/register"
                    className="px-8 py-3 bg-white/10 border border-white/20 text-white font-semibold rounded-full hover:bg-white/20 transition-all text-sm"
                  >
                    Create Account
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Playlists */}
        {playlists.length > 0 && (
          <section className="animate-fade-in-up" style={{ animationDelay: '400ms' }}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-1 h-6 bg-cyan-500 rounded-full" />
                <h2 className="text-xl font-bold text-white">Your Playlists</h2>
              </div>
              <Link href="/playlists" className="text-sm text-white/50 hover:text-white transition-colors flex items-center gap-2 group">
                View all
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
              {playlists.slice(0, 5).map((playlist, index) => (
                <div
                  key={playlist._id}
                  className="transform hover:scale-[1.02] transition-transform duration-300 animate-fade-in-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <PlaylistCard playlist={playlist} />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
