"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAuthHeaders } from "@/lib/adminAuth";

/**
 * Admin Dashboard
 * Overview of users, songs, and playlists
 */
export default function AdminDashboard() {
  const [stats, setStats] = useState({
    users: 0,
    songs: 0,
    playlists: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const headers = getAuthHeaders();

      // Fetch users count
      const usersRes = await fetch("/api/admin/users?limit=1", { headers });
      const usersData = await usersRes.json();

      // Fetch songs count
      const songsRes = await fetch("/api/admin/songs?limit=1", { headers });
      const songsData = await songsRes.json();

      // Fetch playlists count
      const playlistsRes = await fetch("/api/admin/playlists?limit=1", {
        headers,
      });
      const playlistsData = await playlistsRes.json();

      setStats({
        users: usersData.total || 0,
        songs: songsData.total || 0,
        playlists: playlistsData.total || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">Admin Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link href="/admin/users">
          <div className="bg-[#121212] rounded-lg p-6 hover:bg-[#1a1a1a] transition cursor-pointer border border-[#282828]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Total Users</p>
                <p className="text-3xl font-bold text-white">{stats.users}</p>
              </div>
              <div className="text-4xl">👥</div>
            </div>
          </div>
        </Link>

        <Link href="/admin/songs">
          <div className="bg-[#121212] rounded-lg p-6 hover:bg-[#1a1a1a] transition cursor-pointer border border-[#282828]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Total Songs</p>
                <p className="text-3xl font-bold text-white">{stats.songs}</p>
              </div>
              <div className="text-4xl">🎵</div>
            </div>
          </div>
        </Link>

        <Link href="/admin/playlists">
          <div className="bg-[#121212] rounded-lg p-6 hover:bg-[#1a1a1a] transition cursor-pointer border border-[#282828]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Total Playlists</p>
                <p className="text-3xl font-bold text-white">
                  {stats.playlists}
                </p>
              </div>
              <div className="text-4xl">📋</div>
            </div>
          </div>
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="bg-[#121212] rounded-lg p-6 border border-[#282828]">
        <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/admin/users"
            className="px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg text-center font-medium transition"
          >
            Manage Users
          </Link>
          <Link
            href="/admin/songs"
            className="px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg text-center font-medium transition"
          >
            Manage Songs
          </Link>
          <Link
            href="/admin/playlists"
            className="px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg text-center font-medium transition"
          >
            Manage Playlists
          </Link>
          <Link
            href="/admin/upload"
            className="px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg text-center font-medium transition"
          >
            Upload Song
          </Link>
        </div>
      </div>
    </div>
  );
}

