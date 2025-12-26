import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import UserBehavior from "@/models/UserBehavior";
import { authenticateUser } from "@/lib/middleware/auth";
import mongoose from "mongoose";

/**
 * POST /api/behavior/track
 *
 * Track user behavior/interactions with songs
 *
 * Computer Science Concept: Data Collection for Data Mining
 *
 * Tracks various user interactions:
 * - play: When user starts playing a song
 * - pause: When user pauses playback
 * - skip: When user skips to next song
 * - repeat: When user repeats a song
 * - like/unlike: When user likes or unlikes a song
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { songId, action, listenDuration } = body;

    if (!songId || !action) {
      return NextResponse.json(
        {
          success: false,
          error: "songId and action are required",
        },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(songId)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid song ID",
        },
        { status: 400 }
      );
    }

    const validActions = ["play", "pause", "skip", "repeat", "like", "unlike"];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid action. Must be one of: ${validActions.join(", ")}`,
        },
        { status: 400 }
      );
    }

    await connectDB();

    const now = new Date();
    const timeOfDay = now.getHours();
    const dayOfWeek = now.getDay();

    // Create behavior record
    const behavior = await UserBehavior.create({
      userId: user.id,
      songId,
      action,
      listenDuration: listenDuration || undefined,
      timestamp: now,
      timeOfDay,
      dayOfWeek,
    });

    return NextResponse.json(
      {
        success: true,
        data: behavior,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Track behavior error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to track behavior",
      },
      { status: 500 }
    );
  }
}



