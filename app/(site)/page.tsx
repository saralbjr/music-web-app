/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import SongCard from "@/components/SongCard";
import PlaylistCard from "@/components/PlaylistCard";
import { ISong } from "@/models/Song";
import Link from "next/link";

/**
 * Spotify-style Home Page
 * Good Evening section, Recommended playlists, Recently Played
 */
export default function HomePage() {
  const [songs, setSongs] = useState<ISong[]>([]);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [recentSongs, setRecentSongs] = useState<ISong[]>([]);
  const [recommendedSongs, setRecommendedSongs] = useState<ISong[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [moodSongs, setMoodSongs] = useState<ISong[]>([]);
  const [loadingMood, setLoadingMood] = useState(false);

  const getSongId = (song: ISong) => {
    const rawId = (song as any)?._id;
    if (typeof rawId === "string") return rawId;
    if (rawId && typeof rawId.toString === "function") return rawId.toString();
    return String(rawId ?? "");
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch local songs from database
      const songsResponse = await fetch(
        "/api/songs?sortBy=playCount&order=desc"
      );
      const songsData = await songsResponse.json();
      const allSongs: ISong[] = songsData.success ? songsData.data || [] : [];

      setSongs(allSongs);
      // Get top 6 for Good Evening
      setRecentSongs(allSongs.slice(0, 6) || []);

      const user = localStorage.getItem("user");
      const token = localStorage.getItem("token");
      const hasAuth = !!user && !!token;
      setIsAuthenticated(hasAuth);

      // Fetch recommendations only for authenticated users
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

      // Fetch playlists for authenticated users
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

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  // Fetch mood-based recommendations
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
    { name: "Happy", emoji: "😊", color: "from-yellow-500 to-orange-500" },
    { name: "Sad", emoji: "😢", color: "from-blue-500 to-indigo-500" },
    { name: "Relaxed", emoji: "😌", color: "from-green-500 to-teal-500" },
    { name: "Focused", emoji: "🎯", color: "from-purple-500 to-pink-500" },
  ];

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-[#282828] rounded w-64"></div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-[#282828] rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 pb-32">
      {/* Good Evening Section */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">{getGreeting()}</h1>
          {songs.length > 6 && (
            <Link
              href="/songs"
              className="text-sm text-gray-400 hover:text-white hover:underline transition-colors"
            >
              Show all
            </Link>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {recentSongs.length > 0 ? (
            recentSongs.map((song) => (
              <SongCard key={getSongId(song)} song={song} queue={recentSongs} />
            ))
          ) : (
            <p className="text-gray-400 col-span-full">No songs available</p>
          )}
        </div>
      </section>

      {/* Mood-Based Recommendations */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Mood-Based Recommendations</h2>
          <span className="text-sm text-gray-400">
            Rule-based classification system
          </span>
        </div>
        <div className="mb-6">
          <div className="flex gap-3 flex-wrap">
            {moods.map((mood) => (
              <button
                key={mood.name}
                onClick={() => fetchMoodSongs(mood.name)}
                className={`px-6 py-3 rounded-full font-medium transition-all ${
                  selectedMood === mood.name
                    ? `bg-gradient-to-r ${mood.color} text-white shadow-lg scale-105`
                    : "bg-[#282828] text-gray-300 hover:bg-[#383838] hover:text-white"
                }`}
              >
                <span className="mr-2">{mood.emoji}</span>
                {mood.name}
              </button>
            ))}
          </div>
        </div>
        {selectedMood && (
          <div>
            {loadingMood ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="h-48 bg-[#282828] rounded animate-pulse"
                  ></div>
                ))}
              </div>
            ) : moodSongs.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {moodSongs.map((song) => (
                  <SongCard
                    key={getSongId(song)}
                    song={song}
                    queue={moodSongs}
                  />
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-8">
                No songs found for {selectedMood} mood
              </p>
            )}
          </div>
        )}
      </section>

      {/* Recommended For You */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Recommended For You</h2>
          {isAuthenticated && recommendedSongs.length > 0 && (
            <span className="text-sm text-gray-400">
              Personalized by likes, play count and genre
            </span>
          )}
        </div>
        {isAuthenticated ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {recommendedSongs.length > 0 ? (
              recommendedSongs.map((song) => (
                <SongCard
                  key={getSongId(song)}
                  song={song}
                  queue={recommendedSongs}
                />
              ))
            ) : (
              <div className="col-span-full">
                <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-[#1f2933] via-[#111827] to-[#020617] px-6 py-8 md:px-10 md:py-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6 shadow-[0_18px_45px_rgba(0,0,0,0.55)]">
                  <div>
                    <p className="text-sm uppercase tracking-[0.22em] text-blue-400/80 mb-3">
                      Personalized just for you
                    </p>
                    <h3 className="text-2xl md:text-3xl font-semibold text-white mb-3">
                      Start listening to shape your recommendations
                    </h3>
                    <p className="text-sm md:text-base text-gray-300 max-w-xl">
                      Your feed will adapt to what you actually enjoy — likes,
                      genres you explore, and the songs you play on repeat.
                    </p>
                  </div>
                  <div className="flex flex-col items-start md:items-end gap-3">
                    <div className="inline-flex items-center gap-3 rounded-full bg-white/5 border border-white/10 px-4 py-2 backdrop-blur-sm">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-blue-500 to-cyan-400 text-black font-semibold shadow-lg">
                        ♫
                      </span>
                      <span className="text-xs md:text-sm text-gray-200">
                        Hit play on any song to begin your journey.
                      </span>
                    </div>
                    <div className="flex gap-2 text-[11px] md:text-xs text-gray-400">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Real-time taste learning
                      </span>
                      <span className="hidden md:inline-flex px-3 py-1 rounded-full bg-white/5 border border-white/10">
                        Genre & mood aware
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="col-span-full">
            <div className="mt-2 rounded-2xl border border-dashed border-white/15 bg-gradient-to-r from-[#020617] via-[#020617] to-[#020617] px-6 py-8 md:px-10 md:py-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <p className="text-xs uppercase tracking-[0.32em] text-gray-400 mb-3">
                  Your recommendations are waiting
                </p>
                <h3 className="text-2xl md:text-3xl font-semibold text-white mb-3">
                  Listen to songs to generate recommendations for you
                </h3>
                <p className="text-sm md:text-base text-gray-300 max-w-xl">
                  Sign in and start listening to unlock a personalized mix based
                  on your likes, favorite genres, and play history.
                </p>
              </div>
              <div className="flex flex-col items-start md:items-end gap-3">
                <div className="flex gap-3">
                  <a
                    href="/auth/login"
                    className="inline-flex items-center justify-center rounded-full bg-white text-black px-5 py-2.5 text-sm font-medium shadow-lg shadow-white/15 hover:shadow-white/25 hover:scale-[1.02] transition-transform"
                  >
                    Log in to continue
                  </a>
                  <a
                    href="/auth/register"
                    className="inline-flex items-center justify-center rounded-full border border-white/30 bg-white/5 px-5 py-2.5 text-sm font-medium text-white hover:bg-white/10 transition-colors"
                  >
                    Create account
                  </a>
                </div>
                <p className="text-[11px] md:text-xs text-gray-400">
                  No ads. No noise. Just the music you care about, tuned to you.
                </p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Recommended Playlists */}
      {playlists.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Made for You</h2>
            <Link
              href="/playlists"
              className="text-sm text-gray-400 hover:text-white hover:underline transition-colors"
            >
              Show all
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {playlists.slice(0, 5).map((playlist) => (
              <PlaylistCard key={playlist._id} playlist={playlist} />
            ))}
          </div>
        </section>
      )}

      {/* Recently Played */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Recently Played</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {songs.slice(0, 6).map((song) => (
            <SongCard key={getSongId(song)} song={song} queue={songs} />
          ))}
        </div>
      </section>

      {/* Popular Songs */}
      {/* <section>
        <h2 className="text-2xl font-bold mb-6">Popular Right Now</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {[...songs]
            .sort((a, b) => (b.playCount || 0) - (a.playCount || 0))
            .slice(0, 6)
            .map((song) => (
              <SongCard key={getSongId(song)} song={song} queue={songs} />
            ))}
        </div>
      </section> */}
    </div>
  );
}
