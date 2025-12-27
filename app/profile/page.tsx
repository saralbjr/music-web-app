"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import SongCard from "@/components/SongCard";
import PlaylistCard from "@/components/PlaylistCard";
import { ISong } from "@/models/Song";

interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
}

interface Playlist {
  _id: string;
  name: string;
  songs: string[] | ISong[];
  coverUrl?: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [recentSongs, setRecentSongs] = useState<ISong[]>([]);
  const [likedSongs, setLikedSongs] = useState<ISong[]>([]);
  const [topPlayedSongs, setTopPlayedSongs] = useState<ISong[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedUser = localStorage.getItem("user");
    setUser(storedUser ? JSON.parse(storedUser) : null);
  }, []);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        const storedUser = localStorage.getItem("user");
        const token = localStorage.getItem("token");
        const parsedUser = storedUser ? JSON.parse(storedUser) : null;

        if (!parsedUser || !token) {
          setRecentSongs([]);
          setLikedSongs([]);
          setTopPlayedSongs([]);
          setPlaylists([]);
          return;
        }

        // Recently played (approximate: latest added)
        const recentRes = await fetch(
          "/api/songs?sortBy=createdAt&order=desc&limit=6"
        );
        const recentData = await recentRes.json();
        setRecentSongs(
          recentData.success && Array.isArray(recentData.data)
            ? recentData.data
            : []
        );

        // Liked songs
        const likedRes = await fetch("/api/songs/like", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const likedData = await likedRes.json();
        setLikedSongs(
          likedData.success && Array.isArray(likedData.data)
            ? likedData.data
            : []
        );

        // User playlists
        const playlistsRes = await fetch(
          `/api/playlists?userId=${parsedUser.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const playlistsData = await playlistsRes.json();
        setPlaylists(
          playlistsData.success && Array.isArray(playlistsData.data)
            ? playlistsData.data
            : []
        );

        // Most played (global, by playCount)
        const topRes = await fetch(
          "/api/songs?sortBy=playCount&order=desc&limit=6"
        );
        const topData = await topRes.json();
        setTopPlayedSongs(
          topData.success && Array.isArray(topData.data)
            ? topData.data
            : []
        );
      } catch (error) {
        console.error("Failed to load profile songs", error);
        setRecentSongs([]);
        setLikedSongs([]);
        setTopPlayedSongs([]);
        setPlaylists([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, []);

  const displayName = user?.name || "Guest Listener";
  const memberSince =
    user?.createdAt || user?.updatedAt
      ? new Date(user.createdAt || user.updatedAt).getFullYear()
      : new Date().getFullYear();
  const initials = useMemo(() => {
    return displayName
      .split(" ")
      .map((segment: string) => segment.charAt(0).toUpperCase())
      .slice(0, 2)
      .join("");
  }, [displayName]);

  return (
    <div className="min-h-full space-y-10">
      <section className="relative bg-gradient-to-b from-emerald-700/80 via-emerald-900/40 to-transparent px-8 py-10">
        <div className="flex flex-wrap items-end gap-8">
          <div className="w-48 h-48 rounded-full bg-emerald-500 shadow-2xl flex items-center justify-center overflow-hidden ring-8 ring-emerald-400/40">
            {user?.image ? (
              <img
                src={user.image}
                alt={displayName}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="text-5xl font-black text-white">{initials}</span>
            )}
          </div>
          <div className="flex-1 min-w-[250px]">
            <p className="uppercase tracking-[0.3em] text-white/70 font-semibold text-xs mb-1">
              Profile
            </p>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black">
              {displayName}
            </h1>
            {user && (
              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-white/80">
                <span className="font-semibold text-white">
                  {user?.email || "Not signed in"}
                </span>
                <span>•</span>
                <span>{likedSongs.length || 0} favorites</span>
                <span>•</span>
                <span>{playlists.length || 0} playlists</span>
                <span>•</span>
                <span>Member since {memberSince}</span>
              </div>
            )}
          </div>
          {user && (
            <div className="flex gap-3">
              <Link
                href="/profile/settings"
                className="px-5 py-2 rounded-full bg-white text-black font-semibold text-sm hover:scale-105 transition-transform"
              >
                Edit profile
              </Link>
            </div>
          )}
        </div>
      </section>

      <section className="px-8 pb-16 space-y-10">
        {/* Recently played (approximate) */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold">Recently played</h2>
              <p className="text-sm text-white/60">
                A snapshot of what&apos;s been spinning lately
              </p>
            </div>
            <Link
              href="/library"
              className="text-sm text-white/70 hover:text-white"
            >
              View library
            </Link>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {[...Array(6)].map((_, idx) => (
                <div
                  key={idx}
                  className="animate-pulse bg-[#181818] rounded-2xl h-64"
                />
              ))}
            </div>
          ) : recentSongs.length ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {recentSongs.map((song) => (
                <SongCard
                  key={String(song._id)}
                  song={song}
                  queue={recentSongs}
                />
              ))}
            </div>
          ) : (
            <div className="text-center text-white/60 py-10 bg-[#181818] rounded-3xl border border-white/5">
              No recent activity yet. Start listening to fill this space.
            </div>
          )}
        </div>

        {/* Favorites */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold">Favorites</h2>
              <p className="text-sm text-white/60">
                Your liked songs, all in one place
              </p>
            </div>
            <Link
              href="/liked"
              className="text-sm text-white/70 hover:text-white"
            >
              Open Favorites
            </Link>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {[...Array(6)].map((_, idx) => (
                <div
                  key={idx}
                  className="animate-pulse bg-[#181818] rounded-2xl h-64"
                />
              ))}
            </div>
          ) : likedSongs.length ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {likedSongs.slice(0, 6).map((song) => (
                <SongCard
                  key={String(song._id)}
                  song={song}
                  queue={likedSongs}
                  showLikeButton
                />
              ))}
            </div>
          ) : (
            <div className="text-center text-white/60 py-10 bg-[#181818] rounded-3xl border border-white/5">
              No favorites yet. Like songs to see them here.
            </div>
          )}
        </div>

        {/* Playlists */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold">Playlists</h2>
              <p className="text-sm text-white/60">
                Curated collections you&apos;ve created
              </p>
            </div>
            <Link
              href="/playlists"
              className="text-sm text-white/70 hover:text-white"
            >
              Manage playlists
            </Link>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {[...Array(5)].map((_, idx) => (
                <div
                  key={idx}
                  className="animate-pulse bg-[#181818] rounded-2xl h-40"
                />
              ))}
            </div>
          ) : playlists.length ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {playlists.slice(0, 5).map((playlist) => (
                <PlaylistCard key={playlist._id} playlist={playlist} />
              ))}
            </div>
          ) : (
            <div className="text-center text-white/60 py-10 bg-[#181818] rounded-3xl border border-white/5">
              No playlists yet. Create one to get started.
            </div>
          )}
        </div>

        {/* Most played (if available) */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold">Most played</h2>
              <p className="text-sm text-white/60">
                Tracks that get the most love overall
              </p>
            </div>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {[...Array(6)].map((_, idx) => (
                <div
                  key={idx}
                  className="animate-pulse bg-[#181818] rounded-2xl h-64"
                />
              ))}
            </div>
          ) : topPlayedSongs.length ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {topPlayedSongs.map((song) => (
                <SongCard
                  key={String(song._id)}
                  song={song}
                  queue={topPlayedSongs}
                />
              ))}
            </div>
          ) : (
            <div className="text-center text-white/60 py-10 bg-[#181818] rounded-3xl border border-white/5">
              Most played data isn&apos;t available yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
