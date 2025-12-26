/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

/**
 * Analytics Dashboard Page
 *
 * Displays user behavior analytics with simple charts
 *
 * Computer Science Concepts:
 * - Data Mining: Visualizes collected behavior data
 * - Pattern Recognition: Shows patterns in user behavior
 * - Decision Support Systems: Provides insights for recommendations
 */
export default function AnalyticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any>(null);

  const checkAuth = useCallback(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/auth/login");
    }
  }, [router]);

  const fetchAnalytics = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
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
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
    fetchAnalytics();
  }, [checkAuth, fetchAnalytics]);

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getMaxValue = (data: Record<string | number, number>): number => {
    const values = Object.values(data);
    return Math.max(...values, 1);
  };

  const SimpleBarChart = ({
    data,
    title,
    valueFormatter,
  }: {
    data: Record<string | number, number>;
    title: string;
    valueFormatter?: (value: number) => string;
  }) => {
    const maxValue = getMaxValue(data);
    const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);

    return (
      <div className="bg-[#181818] rounded-lg p-6 border border-[#282828]">
        <h3 className="text-xl font-bold mb-4">{title}</h3>
        <div className="space-y-3">
          {entries.length === 0 ? (
            <p className="text-gray-400 text-center py-4">No data available</p>
          ) : (
            entries.map(([key, value]) => (
              <div key={key} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">{key}</span>
                  <span className="text-white font-medium">
                    {valueFormatter ? valueFormatter(value) : value}
                  </span>
                </div>
                <div className="h-2 bg-[#282828] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all"
                    style={{ width: `${(value / maxValue) * 100}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-[#282828] rounded w-64"></div>
          <div className="h-48 bg-[#282828] rounded"></div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg mb-2">
            No analytics data available
          </p>
          <p className="text-gray-500 text-sm">
            Start listening to songs to generate analytics
          </p>
        </div>
      </div>
    );
  }

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
    <div className="p-8 pb-32">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Analytics Dashboard</h1>
        <p className="text-gray-400">
          User behavior analysis and listening patterns
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-[#181818] rounded-lg p-6 border border-[#282828]">
          <p className="text-gray-400 text-sm mb-1">Total Plays</p>
          <p className="text-3xl font-bold">{analytics.totalPlays || 0}</p>
        </div>
        <div className="bg-[#181818] rounded-lg p-6 border border-[#282828]">
          <p className="text-gray-400 text-sm mb-1">Total Skips</p>
          <p className="text-3xl font-bold">{analytics.totalSkips || 0}</p>
        </div>
        <div className="bg-[#181818] rounded-lg p-6 border border-[#282828]">
          <p className="text-gray-400 text-sm mb-1">Total Listening Time</p>
          <p className="text-3xl font-bold">
            {formatDuration(analytics.totalListenTime || 0)}
          </p>
        </div>
      </div>

      {/* Most Played Songs */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Most Played Songs</h2>
        <div className="bg-[#181818] rounded-lg border border-[#282828] overflow-hidden">
          <div className="divide-y divide-[#282828]">
            {analytics.mostPlayedSongs &&
            analytics.mostPlayedSongs.length > 0 ? (
              analytics.mostPlayedSongs.map((item: any, index: number) => (
                <div
                  key={item.song?._id || index}
                  className="p-4 flex items-center justify-between hover:bg-[#282828] transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <span className="text-gray-400 w-8 text-center">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">
                        {item.song?.title || "Unknown"}
                      </p>
                      <p className="text-gray-400 text-sm truncate">
                        {item.song?.artist || "Unknown Artist"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold">{item.playCount}</p>
                    <p className="text-gray-400 text-xs">plays</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-400">
                No play data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Most Skipped Songs */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Most Skipped Songs</h2>
        <div className="bg-[#181818] rounded-lg border border-[#282828] overflow-hidden">
          <div className="divide-y divide-[#282828]">
            {analytics.mostSkippedSongs &&
            analytics.mostSkippedSongs.length > 0 ? (
              analytics.mostSkippedSongs.map((item: any, index: number) => (
                <div
                  key={item.song?._id || index}
                  className="p-4 flex items-center justify-between hover:bg-[#282828] transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <span className="text-gray-400 w-8 text-center">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">
                        {item.song?.title || "Unknown"}
                      </p>
                      <p className="text-gray-400 text-sm truncate">
                        {item.song?.artist || "Unknown Artist"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold">{item.skipCount}</p>
                    <p className="text-gray-400 text-xs">skips</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-400">
                No skip data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Listening Time by Mood */}
        <SimpleBarChart
          data={analytics.listeningTimeByMood || {}}
          title="Listening Time by Mood"
          valueFormatter={(value) => formatDuration(value)}
        />

        {/* Time of Day Patterns */}
        <SimpleBarChart
          data={
            (Object.fromEntries(
              Object.entries(analytics.timeOfDayPatterns || {}).map(
                ([key, value]) => [
                  timeOfDayLabels[parseInt(key)] || key,
                  typeof value === "number" ? value : 0,
                ]
              )
            ) || {}) as Record<string | number, number>
          }
          title="Listening Patterns by Time of Day"
        />

        {/* Day of Week Patterns */}
        <SimpleBarChart
          data={
            (Object.fromEntries(
              Object.entries(analytics.dayOfWeekPatterns || {}).map(
                ([key, value]) => [
                  daysOfWeek[parseInt(key)] || key,
                  typeof value === "number" ? value : 0,
                ]
              )
            ) || {}) as Record<string | number, number>
          }
          title="Listening Patterns by Day of Week"
        />
      </div>
    </div>
  );
}
