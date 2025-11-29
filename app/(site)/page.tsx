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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch local songs from database
      const songsResponse = await fetch("/api/songs?sortBy=playCount&order=desc");
      const songsData = await songsResponse.json();
      const allSongs: ISong[] = songsData.success ? songsData.data || [] : [];

      setSongs(allSongs);
      // Get top 6 for Good Evening
      setRecentSongs(allSongs.slice(0, 6) || []);

      // Fetch playlists
      const user = localStorage.getItem("user");
      const token = localStorage.getItem("token");
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
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
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
        <h1 className="text-3xl font-bold mb-6">{getGreeting()}</h1>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {recentSongs.length > 0 ? (
            recentSongs.map((song) => (
              <Link
                key={song._id.toString()}
                href={`/songs/${song._id}`}
                className="group"
              >
                <div className="bg-[#181818] rounded-lg p-4 hover:bg-[#282828] transition-all duration-200 cursor-pointer h-full">
                  <div className="relative mb-4">
                    {song.coverFile ? (
                      <div className="aspect-square rounded-lg overflow-hidden shadow-lg">
                        <img
                          src={song.coverFile}
                          alt={song.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="aspect-square bg-[#282828] rounded-lg flex items-center justify-center">
                        <svg
                          className="w-12 h-12 text-gray-500"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 3a1 1 0 00-1.447-.894L8.763 6H5a3 3 0 000 6h.28l1.771 5.316A1 1 0 008 18h1a1 1 0 001-1v-4.382l6.553 3.276A1 1 0 0018 15V3z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                  <h3 className="font-semibold text-white truncate mb-1 group-hover:text-blue-400 transition-colors">
                    {song.title}
                  </h3>
                  <p className="text-sm text-gray-400 truncate">{song.artist}</p>
                </div>
              </Link>
            ))
          ) : (
            <p className="text-gray-400 col-span-full">No songs available</p>
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
            <SongCard key={song._id.toString()} song={song} queue={songs} />
          ))}
        </div>
      </section>

      {/* Popular Songs */}
      <section>
        <h2 className="text-2xl font-bold mb-6">Popular Right Now</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {songs
            .sort((a, b) => (b.playCount || 0) - (a.playCount || 0))
            .slice(0, 6)
            .map((song) => (
              <SongCard key={song._id.toString()} song={song} queue={songs} />
            ))}
        </div>
      </section>
    </div>
  );
}
