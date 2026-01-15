import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Song from "@/models/Song";
import Playlist from "@/models/Playlist";
import { requireAdmin } from "@/lib/middleware/auth";

/**
 * GET /api/admin/analytics
 * Get analytics data for dashboard charts (Admin only)
 */
export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const { response } = await requireAdmin(request);
    if (response) return response;

    await connectDB();

    // Get total counts
    const totalUsers = await User.countDocuments();
    const totalSongs = await Song.countDocuments();
    const totalPlaylists = await Playlist.countDocuments();
    const totalPlays = await Song.aggregate([
      { $group: { _id: null, total: { $sum: "$playCount" } } },
    ]);
    const totalPlaysCount = totalPlays[0]?.total || 0;

    // Songs uploaded per month (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const songsPerMonth = await Song.aggregate([
      {
        $match: {
          createdAt: { $gte: twelveMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
    ]);

    // Format songs per month data
    const songsPerMonthData = songsPerMonth.map((item) => ({
      month: `${item._id.year}-${String(item._id.month).padStart(2, "0")}`,
      count: item.count,
    }));

    // User growth over time (last 12 months) - cumulative count
    const userGrowth = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: twelveMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
    ]);

    // Calculate cumulative user growth
    const usersBeforePeriod = await User.countDocuments({
      createdAt: { $lt: twelveMonthsAgo },
    });

    let cumulativeUsers = usersBeforePeriod;
    const userGrowthData = userGrowth.map((item) => {
      cumulativeUsers += item.count;
      return {
        month: `${item._id.year}-${String(item._id.month).padStart(2, "0")}`,
        count: cumulativeUsers,
      };
    });

    // Genre distribution
    const genreDistribution = await Song.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    const genreData = genreDistribution.map((item) => ({
      name: item._id,
      value: item.count,
    }));

    // Recent activity - recently added songs
    const recentSongs = await Song.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("title artist category createdAt coverFile");

    // Recent activity - recently created playlists
    const recentPlaylists = await Playlist.find()
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .limit(5)
      .select("name userId createdAt songs");

    return NextResponse.json(
      {
        success: true,
        data: {
          stats: {
            totalUsers,
            totalSongs,
            totalPlaylists,
            totalPlays: totalPlaysCount,
          },
          charts: {
            songsPerMonth: songsPerMonthData,
            userGrowth: userGrowthData,
            genreDistribution: genreData,
          },
          recentActivity: {
            songs: recentSongs,
            playlists: recentPlaylists,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch analytics data",
      },
      { status: 500 }
    );
  }
}
