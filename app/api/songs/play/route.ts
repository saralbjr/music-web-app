import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Song from "@/models/Song";
import mongoose from "mongoose";
import { authenticateUser } from "@/lib/middleware/auth";

/**
 * POST /api/songs/play
 * Increments playCount for a song. Auth is optional; when present,
 * we can later extend to log per-user history.
 */
export async function POST(request: NextRequest) {
  try {
    const body: { songId?: string } = await request.json();
    const { songId } = body || {};

    if (!songId) {
      return NextResponse.json(
        { success: false, error: "songId is required" },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(songId)) {
      return NextResponse.json(
        { success: false, error: "Invalid song ID" },
        { status: 400 }
      );
    }

    // Optional auth (future: per-user history)
    await authenticateUser(request);

    await connectDB();
    const song = await Song.findById(songId);
    if (!song) {
      return NextResponse.json(
        { success: false, error: "Song not found" },
        { status: 404 }
      );
    }

    song.playCount = (song.playCount || 0) + 1;
    await song.save();

    return NextResponse.json(
      { success: true, data: song.toObject() },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Increment play error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to increment play count",
      },
      { status: 500 }
    );
  }
}
