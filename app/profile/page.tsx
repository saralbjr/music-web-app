/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import SongCard from "@/components/SongCard";
import PlaylistCard from "@/components/PlaylistCard";
import { ISong } from "@/models/Song";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
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
  const [analytics, setAnalytics] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
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
          topData.success && Array.isArray(topData.data) ? topData.data : []
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

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setAnalyticsLoading(true);
        const token = localStorage.getItem("token");
        if (!token) {
          setAnalytics(null);
          return;
        }

        const response = await fetch("/api/analytics", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setAnalytics(data.data);
          }
        }
      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setAnalyticsLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const displayName = user?.name || "Guest Listener";
  const memberSince =
    user?.createdAt || user?.updatedAt
      ? new Date(
          (user.createdAt as string | Date) || (user.updatedAt as string | Date)
        ).getFullYear()
      : new Date().getFullYear();
  const initials = useMemo(() => {
    return displayName
      .split(" ")
      .map((segment: string) => segment.charAt(0).toUpperCase())
      .slice(0, 2)
      .join("");
  }, [displayName]);

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const daysOfWeek = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  const timeOfDayLabels: Record<number, string> = {};
  for (let i = 0; i < 24; i++) {
    const hour =
      i < 12 ? `${i === 0 ? 12 : i} AM` : `${i === 12 ? 12 : i - 12} PM`;
    timeOfDayLabels[i] = hour;
  }



  return (
    <div className="min-h-full space-y-10">
      <section className="relative bg-gradient-to-b from-emerald-700/80 via-emerald-900/40 to-transparent px-8 py-10">
        <div className="flex flex-wrap items-end gap-8">
          <div className="w-48 h-48 rounded-full bg-emerald-500 shadow-2xl flex items-center justify-center overflow-hidden ring-8 ring-emerald-400/40">
            {user?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
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
                <PlaylistCard
                  key={playlist._id}
                  playlist={{
                    _id: playlist._id,
                    name: playlist.name,
                    songs:
                      Array.isArray(playlist.songs) &&
                      playlist.songs.length > 0 &&
                      typeof playlist.songs[0] === "object"
                        ? (playlist.songs as ISong[])
                        : undefined,
                    coverUrl: playlist.coverUrl,
                  }}
                />
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

        {/* Analytics Section */}
        <div>
          <div className="mb-4">
            <h2 className="text-2xl font-bold">Listening Analytics</h2>
            <p className="text-sm text-white/60">
              Insights into your listening habits and patterns
            </p>
          </div>

          {analyticsLoading ? (
            <div className="space-y-6">
              <div className="animate-pulse grid grid-cols-1 md:grid-cols-3 gap-4">
                {[...Array(3)].map((_, idx) => (
                  <div
                    key={idx}
                    className="h-32 bg-[#181818] rounded-lg border border-[#282828]"
                  />
                ))}
              </div>
              <div className="animate-pulse h-96 bg-[#181818] rounded-lg border border-[#282828]" />
            </div>
          ) : analytics ? (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-lg p-6 border border-blue-500/30">
                  <p className="text-gray-400 text-sm mb-1">Total Plays</p>
                  <p className="text-3xl font-bold">
                    {analytics.totalPlays || 0}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-lg p-6 border border-purple-500/30">
                  <p className="text-gray-400 text-sm mb-1">Total Skips</p>
                  <p className="text-3xl font-bold">
                    {analytics.totalSkips || 0}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 rounded-lg p-6 border border-emerald-500/30">
                  <p className="text-gray-400 text-sm mb-1">
                    Total Listening Time
                  </p>
                  <p className="text-3xl font-bold">
                    {formatDuration(analytics.totalListenTime || 0)}
                  </p>
                </div>
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Listening Time by Mood - Bar Chart */}
                {analytics.listeningTimeByMood &&
                Object.keys(analytics.listeningTimeByMood).length > 0 ? (
                  <div className="bg-[#181818] rounded-lg p-6 border border-[#282828]">
                    <h3 className="text-xl font-bold mb-4">
                      Listening Time by Mood
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={Object.entries(analytics.listeningTimeByMood)
                          .map(([name, value]) => ({
                            name,
                            value: typeof value === "number" ? value : 0,
                            formatted: formatDuration(
                              typeof value === "number" ? value : 0
                            ),
                          }))
                          .sort((a, b) => b.value - a.value)}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#282828" />
                        <XAxis
                          dataKey="name"
                          tick={{ fill: "#b3b3b3" }}
                          angle={-45}
                          textAnchor="end"
                          height={100}
                        />
                        <YAxis tick={{ fill: "#b3b3b3" }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#282828",
                            border: "1px solid #404040",
                            borderRadius: "8px",
                          }}
                          formatter={(value: number | any) => formatDuration(Number(value || 0))}
                        />
                        <Bar
                          dataKey="value"
                          fill="#1d4ed8"
                          radius={[8, 8, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : null}

                {/* Time of Day Patterns - Line Chart */}
                {analytics.timeOfDayPatterns &&
                Object.keys(analytics.timeOfDayPatterns).length > 0 ? (
                  <div className="bg-[#181818] rounded-lg p-6 border border-[#282828]">
                    <h3 className="text-xl font-bold mb-4">
                      Listening Patterns by Time of Day
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart
                        data={Object.entries(analytics.timeOfDayPatterns)
                          .map(([key, value]) => ({
                            time: timeOfDayLabels[parseInt(key)] || key,
                            value: typeof value === "number" ? value : 0,
                          }))
                          .sort((a, b) => {
                            const aKey = Object.values(timeOfDayLabels).indexOf(
                              a.time
                            );
                            const bKey = Object.values(timeOfDayLabels).indexOf(
                              b.time
                            );
                            return aKey - bKey;
                          })}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#282828" />
                        <XAxis
                          dataKey="time"
                          tick={{ fill: "#b3b3b3", fontSize: 12 }}
                          angle={-45}
                          textAnchor="end"
                          height={100}
                        />
                        <YAxis tick={{ fill: "#b3b3b3" }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#282828",
                            border: "1px solid #404040",
                            borderRadius: "8px",
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          dot={{ fill: "#3b82f6", r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : null}

                {/* Day of Week Patterns - Bar Chart */}
                {analytics.dayOfWeekPatterns &&
                Object.keys(analytics.dayOfWeekPatterns).length > 0 ? (
                  <div className="bg-[#181818] rounded-lg p-6 border border-[#282828]">
                    <h3 className="text-xl font-bold mb-4">
                      Listening Patterns by Day of Week
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={Object.entries(analytics.dayOfWeekPatterns)
                          .map(([key, value]) => ({
                            day: daysOfWeek[parseInt(key)] || key,
                            value: typeof value === "number" ? value : 0,
                          }))
                          .sort((a, b) => {
                            const aIdx = daysOfWeek.indexOf(a.day);
                            const bIdx = daysOfWeek.indexOf(b.day);
                            return aIdx === -1 || bIdx === -1 ? 0 : aIdx - bIdx;
                          })}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#282828" />
                        <XAxis
                          dataKey="day"
                          tick={{ fill: "#b3b3b3" }}
                          angle={-45}
                          textAnchor="end"
                          height={100}
                        />
                        <YAxis tick={{ fill: "#b3b3b3" }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#282828",
                            border: "1px solid #404040",
                            borderRadius: "8px",
                          }}
                        />
                        <Bar
                          dataKey="value"
                          fill="#8b5cf6"
                          radius={[8, 8, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : null}

                {/* Most Played Songs - List with Chart */}
                {analytics.mostPlayedSongs &&
                analytics.mostPlayedSongs.length > 0 ? (
                  <div className="bg-[#181818] rounded-lg p-6 border border-[#282828]">
                    <h3 className="text-xl font-bold mb-4">
                      Most Played Songs
                    </h3>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {analytics.mostPlayedSongs
                        .slice(0, 5)
                        .map((item: any, index: number) => (
                          <div
                            key={item.song?._id || index}
                            className="flex items-center justify-between p-3 rounded-lg hover:bg-[#282828] transition-colors"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <span className="text-gray-400 w-6 text-center text-sm">
                                {index + 1}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-white font-medium truncate text-sm">
                                  {item.song?.title || "Unknown"}
                                </p>
                                <p className="text-gray-400 text-xs truncate">
                                  {item.song?.artist || "Unknown Artist"}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-white font-bold text-sm">
                                {item.playCount}
                              </p>
                              <p className="text-gray-400 text-xs">plays</p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="text-center text-white/60 py-12 bg-[#181818] rounded-3xl border border-white/5">
              <p className="text-lg mb-2">No analytics data available</p>
              <p className="text-sm text-white/40">
                Start listening to songs to generate analytics
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
