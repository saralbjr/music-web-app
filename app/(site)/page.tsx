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

      // Fetch playlists
      const user = localStorage.getItem("user");
      const token = localStorage.getItem("token");
      // Fetch recommendations (uses liked songs if token is present)
      try {
        const recResponse = await fetch("/api/songs/recommend?limit=8", {
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {},
        });
        const recData = await recResponse.json();
        if (recData.success && Array.isArray(recData.data)) {
          setRecommendedSongs(recData.data);
        }
      } catch (error) {
        console.error("Error fetching recommendations:", error);
      }

      if (user && token) {
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

      {/* Recommended For You */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Recommended For You</h2>
          {recommendedSongs.length > 0 && (
            <span className="text-sm text-gray-400">
              Personalized by likes, play count and genre
            </span>
          )}
        </div>
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
            <p className="text-gray-400 col-span-full">
              Recommendations appear after you like or play songs.
            </p>
          )}
        </div>
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
