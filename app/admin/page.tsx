"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAuthHeaders } from "@/lib/adminAuth";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface AnalyticsData {
  stats: {
    totalUsers: number;
    totalSongs: number;
    totalPlaylists: number;
    totalPlays: number;
  };
  charts: {
    songsPerMonth: Array<{ month: string; count: number }>;
    userGrowth: Array<{ month: string; count: number }>;
    genreDistribution: Array<{ name: string; value: number }>;
  };
  recentActivity: {
    songs: Array<{
      _id: string;
      title: string;
      artist: string;
      category: string;
      createdAt: string;
      coverFile: string;
    }>;
    playlists: Array<{
      _id: string;
      name: string;
      userId: { name: string; email: string };
      songs: Array<unknown>;
      createdAt: string;
    }>;
  };
}

const COLORS = [
  "#1d4ed8",
  "#1ed760",
  "#f8e003ff",
  "#ff0000ff",
  "#923effff",
  "#ea00ffff",
  "#00aeffff",
  "#ffffffff",
];

/**
 * Admin Dashboard
 * Overview of users, songs, and playlists with charts
 */
export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const headers = getAuthHeaders();
      const res = await fetch("/api/admin/analytics", { headers });
      const data = await res.json();
      if (data.success) {
        setAnalytics(data.data);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="space-y-8">
        {/* Statistics Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, idx) => (
            <div
              key={idx}
              className="bg-gradient-to-br from-[#1a1a1a] to-[#121212] rounded-xl p-6 border border-[#282828] shadow-lg animate-pulse"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="h-4 w-24 bg-[#282828] rounded mb-4"></div>
                  <div className="h-10 w-20 bg-[#282828] rounded"></div>
                </div>
                <div className="w-12 h-12 rounded-lg bg-[#282828]"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, idx) => (
            <div
              key={idx}
              className="bg-gradient-to-br from-[#1a1a1a] to-[#121212] rounded-xl p-6 border border-[#282828] shadow-lg animate-pulse"
            >
              <div className="h-6 w-48 bg-[#282828] rounded mb-6"></div>
              <div className="h-[300px] bg-[#282828] rounded"></div>
            </div>
          ))}
        </div>

        {/* Pie Chart Skeleton */}
        <div className="bg-gradient-to-br from-[#1a1a1a] to-[#121212] rounded-xl p-6 border border-[#282828] shadow-lg animate-pulse">
          <div className="h-6 w-48 bg-[#282828] rounded mb-6"></div>
          <div className="h-[350px] bg-[#282828] rounded"></div>
        </div>

        {/* Recent Activity Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, idx) => (
            <div
              key={idx}
              className="bg-gradient-to-br from-[#1a1a1a] to-[#121212] rounded-xl p-6 border border-[#282828] shadow-lg animate-pulse"
            >
              <div className="h-6 w-48 bg-[#282828] rounded mb-6"></div>
              <div className="space-y-4">
                {[...Array(3)].map((_, itemIdx) => (
                  <div key={itemIdx} className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-lg bg-[#282828]"></div>
                    <div className="flex-1">
                      <div className="h-4 w-32 bg-[#282828] rounded mb-2"></div>
                      <div className="h-3 w-48 bg-[#282828] rounded"></div>
                    </div>
                    <div className="h-3 w-16 bg-[#282828] rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-400">Failed to load dashboard data</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link href="/admin/users">
          <div className="bg-gradient-to-br from-[#1a1a1a] to-[#121212] rounded-xl p-6 hover:from-[#1d4ed8]/10 hover:to-[#1a1a1a] transition-all cursor-pointer border border-[#282828] shadow-lg hover:shadow-[#1d4ed8]/20 hover:border-[#1d4ed8]/30 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-2 font-medium">
                  Total Users
                </p>
                <p className="text-4xl font-bold text-white group-hover:text-[#1d4ed8] transition-colors">
                  {analytics.stats.totalUsers.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-[#1d4ed8]/20 flex items-center justify-center group-hover:bg-[#1d4ed8]/30 transition-colors">
                <svg
                  className="w-6 h-6 text-[#1d4ed8]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/admin/songs">
          <div className="bg-gradient-to-br from-[#1a1a1a] to-[#121212] rounded-xl p-6 hover:from-[#1d4ed8]/10 hover:to-[#1a1a1a] transition-all cursor-pointer border border-[#282828] shadow-lg hover:shadow-[#1d4ed8]/20 hover:border-[#1d4ed8]/30 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-2 font-medium">
                  Total Songs
                </p>
                <p className="text-4xl font-bold text-white group-hover:text-[#1d4ed8] transition-colors">
                  {analytics.stats.totalSongs.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-[#1d4ed8]/20 flex items-center justify-center group-hover:bg-[#1d4ed8]/30 transition-colors">
                <svg
                  className="w-6 h-6 text-[#1d4ed8]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                  />
                </svg>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/admin/playlists">
          <div className="bg-gradient-to-br from-[#1a1a1a] to-[#121212] rounded-xl p-6 hover:from-[#1d4ed8]/10 hover:to-[#1a1a1a] transition-all cursor-pointer border border-[#282828] shadow-lg hover:shadow-[#1d4ed8]/20 hover:border-[#1d4ed8]/30 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-2 font-medium">
                  Total Playlists
                </p>
                <p className="text-4xl font-bold text-white group-hover:text-[#1d4ed8] transition-colors">
                  {analytics.stats.totalPlaylists.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-[#1d4ed8]/20 flex items-center justify-center group-hover:bg-[#1d4ed8]/30 transition-colors">
                <svg
                  className="w-6 h-6 text-[#1d4ed8]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 10h16M4 14h16M4 18h16"
                  />
                </svg>
              </div>
            </div>
          </div>
        </Link>

        <div className="bg-gradient-to-br from-[#1a1a1a] to-[#121212] rounded-xl p-6 border border-[#282828] shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-2 font-medium">
                Total Plays
              </p>
              <p className="text-4xl font-bold text-white">
                {analytics.stats.totalPlays.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-[#1d4ed8]/20 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-[#1d4ed8]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Songs Uploaded Per Month - Bar Chart */}
        <div className="bg-gradient-to-br from-[#1a1a1a] to-[#121212] rounded-xl p-6 border border-[#282828] shadow-lg">
          <h3 className="text-lg font-semibold text-white mb-6">
            Songs Uploaded Per Month
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.charts.songsPerMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#282828" />
              <XAxis
                dataKey="month"
                stroke="#888"
                tick={{ fill: "#888", fontSize: 12 }}
              />
              <YAxis stroke="#888" tick={{ fill: "#888", fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1a1a1a",
                  border: "1px solid #282828",
                  borderRadius: "8px",
                  color: "#fff",
                }}
              />
              <Bar dataKey="count" fill="#1d4ed8" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* User Growth Over Time - Line Chart */}
        <div className="bg-gradient-to-br from-[#1a1a1a] to-[#121212] rounded-xl p-6 border border-[#282828] shadow-lg">
          <h3 className="text-lg font-semibold text-white mb-6">
            User Growth Over Time
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.charts.userGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#282828" />
              <XAxis
                dataKey="month"
                stroke="#888"
                tick={{ fill: "#888", fontSize: 12 }}
              />
              <YAxis stroke="#888" tick={{ fill: "#888", fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1a1a1a",
                  border: "1px solid #282828",
                  borderRadius: "8px",
                  color: "#fff",
                }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#1d4ed8"
                strokeWidth={3}
                dot={{ fill: "#1d4ed8", r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Genre Distribution - Pie Chart */}
      <div className="bg-gradient-to-br from-[#1a1a1a] to-[#121212] rounded-xl p-6 border border-[#282828] shadow-lg">
        <h3 className="text-lg font-semibold text-white mb-6">
          Genre Distribution
        </h3>
        <ResponsiveContainer width="100%" height={350}>
          <PieChart>
            <Pie
              data={analytics.charts.genreDistribution}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) =>
                `${name}: ${((percent || 0) * 100).toFixed(0)}%`
              }
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {analytics.charts.genreDistribution.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "#1a1a1a",
                border: "1px solid #282828",
                borderRadius: "8px",
                color: "#fff",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Songs */}
        <div className="bg-gradient-to-br from-[#1a1a1a] to-[#121212] rounded-xl p-6 border border-[#282828] shadow-lg">
          <h3 className="text-lg font-semibold text-white mb-6">
            Recently Added Songs
          </h3>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {analytics.recentActivity.songs.length === 0 ? (
              <p className="text-gray-400 text-sm">No recent songs</p>
            ) : (
              analytics.recentActivity.songs.map((song) => (
                <div
                  key={song._id}
                  className="flex items-center space-x-4 p-3 rounded-lg hover:bg-[#1a1a1a] transition-colors"
                >
                  <div className="w-12 h-12 rounded-lg bg-[#282828] flex-shrink-0 overflow-hidden">
                    {song.coverFile ? (
                      <img
                        src={song.coverFile}
                        alt={song.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg
                          className="w-6 h-6 text-gray-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">
                      {song.title}
                    </p>
                    <p className="text-gray-400 text-sm truncate">
                      {song.artist} • {song.category}
                    </p>
                  </div>
                  <div className="text-gray-500 text-xs flex-shrink-0">
                    {formatDate(song.createdAt)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Playlists */}
        <div className="bg-gradient-to-br from-[#1a1a1a] to-[#121212] rounded-xl p-6 border border-[#282828] shadow-lg">
          <h3 className="text-lg font-semibold text-white mb-6">
            Recently Created Playlists
          </h3>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {analytics.recentActivity.playlists.length === 0 ? (
              <p className="text-gray-400 text-sm">No recent playlists</p>
            ) : (
              analytics.recentActivity.playlists.map((playlist) => (
                <div
                  key={playlist._id}
                  className="flex items-center space-x-4 p-3 rounded-lg hover:bg-[#1a1a1a] transition-colors"
                >
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#1d4ed8] to-[#1ed760] flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 10h16M4 14h16M4 18h16"
                      />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">
                      {playlist.name}
                    </p>
                    <p className="text-gray-400 text-sm truncate">
                      {playlist.userId?.name || "Unknown"} •{" "}
                      {playlist.songs?.length || 0} songs
                    </p>
                  </div>
                  <div className="text-gray-500 text-xs flex-shrink-0">
                    {formatDate(playlist.createdAt)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
