/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import UserBehavior from "@/models/UserBehavior";
import Song from "@/models/Song";
import { authenticateUser } from "@/lib/middleware/auth";

/**
 * GET /api/analytics
 *
 * Get user behavior analytics
 *
 * Computer Science Concepts:
 * - Data Mining: Analyzes collected behavior data
 * - Pattern Recognition: Identifies patterns in user behavior
 * - Decision Support Systems: Provides insights for recommendations
 *
 * Returns:
 * - Most played songs
 * - Most skipped songs
 * - Listening time by mood
 * - Time-of-day listening patterns
 */
export async function GET(request: NextRequest) {
  try {
    const { user, error } = await authenticateUser(request);

    if (!user || error) {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required",
        },
        { status: 401 }
      );
    }

    await connectDB();

    // Get all user behaviors
    const behaviors = await UserBehavior.find({ userId: user.id })
      .populate("songId")
      .lean();

    // Helper function to extract ObjectId from populated or unpopulated field
    const getSongId = (songId: any): string => {
      if (!songId) return "";
      // If populated, it's an object with _id
      if (typeof songId === "object" && songId._id) {
        return songId._id.toString();
      }
      // If it's already an ObjectId or string
      return songId.toString();
    };

    // Most played songs
    const playActions = behaviors.filter((b) => b.action === "play");
    const playCounts: Record<string, number> = {};
    playActions.forEach((b) => {
      const songId = getSongId(b.songId);
      if (songId) {
        playCounts[songId] = (playCounts[songId] || 0) + 1;
      }
    });
    const mostPlayed = Object.entries(playCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([songId, count]) => ({
        songId,
        count,
      }));

    // Get song details for most played
    const mostPlayedSongs = await Promise.all(
      mostPlayed.map(async (item) => {
        const song = await Song.findById(item.songId).lean();
        return {
          song,
          playCount: item.count,
        };
      })
    );

    // Most skipped songs
    const skipActions = behaviors.filter((b) => b.action === "skip");
    const skipCounts: Record<string, number> = {};
    skipActions.forEach((b) => {
      const songId = getSongId(b.songId);
      if (songId) {
        skipCounts[songId] = (skipCounts[songId] || 0) + 1;
      }
    });
    const mostSkipped = Object.entries(skipCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([songId, count]) => ({
        songId,
        count,
      }));

    // Get song details for most skipped
    const mostSkippedSongs = await Promise.all(
      mostSkipped.map(async (item) => {
        const song = await Song.findById(item.songId).lean();
        return {
          song,
          skipCount: item.count,
        };
      })
    );

    // Listening time by mood
    const playActionsWithDuration = behaviors.filter(
      (b) => b.action === "play" && b.listenDuration
    );
    const moodListenTime: Record<string, number> = {};
    for (const behavior of playActionsWithDuration) {
      const songId = getSongId(behavior.songId);
      if (songId) {
        const song = await Song.findById(songId).lean();
        if (song && song.mood) {
          moodListenTime[song.mood] =
            (moodListenTime[song.mood] || 0) + (behavior.listenDuration || 0);
        }
      }
    }

    // Time-of-day listening patterns
    const timeOfDayCounts: Record<number, number> = {};
    playActions.forEach((b) => {
      const hour = b.timeOfDay || 0;
      timeOfDayCounts[hour] = (timeOfDayCounts[hour] || 0) + 1;
    });

    // Day-of-week listening patterns
    const dayOfWeekCounts: Record<number, number> = {};
    playActions.forEach((b) => {
      const day = b.dayOfWeek || 0;
      dayOfWeekCounts[day] = (dayOfWeekCounts[day] || 0) + 1;
    });

    // Total listening time
    const totalListenTime = playActionsWithDuration.reduce(
      (sum, b) => sum + (b.listenDuration || 0),
      0
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          mostPlayedSongs: mostPlayedSongs.filter((item) => item.song !== null),
          mostSkippedSongs: mostSkippedSongs.filter(
            (item) => item.song !== null
          ),
          listeningTimeByMood: moodListenTime,
          timeOfDayPatterns: timeOfDayCounts,
          dayOfWeekPatterns: dayOfWeekCounts,
          totalListenTime,
          totalPlays: playActions.length,
          totalSkips: skipActions.length,
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Analytics error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch analytics",
      },
      { status: 500 }
    );
  }
}
