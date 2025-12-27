import { NextRequest, NextResponse } from "next/server";
import { authenticateUser } from "@/lib/middleware/auth";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Song from "@/models/Song";
import mongoose from "mongoose";

/**
 * POST /api/songs/like
 * Like or unlike a song
 */
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await authenticateUser(request);
    if (error || !user) {
      return NextResponse.json(
        { success: false, error: error || "Authentication required" },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await request.json();
    const { songId } = body;

    if (!songId) {
      return NextResponse.json(
        { success: false, error: "Song ID is required" },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(songId)) {
      return NextResponse.json(
        { success: false, error: "Invalid song ID" },
        { status: 400 }
      );
    }

    // Verify song exists
    const song = await Song.findById(songId);
    if (!song) {
      return NextResponse.json(
        { success: false, error: "Song not found" },
        { status: 404 }
      );
    }

    // Get user with liked songs
    const userDoc = await User.findById(user.id);
    if (!userDoc) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const songObjectId = new mongoose.Types.ObjectId(songId);
    const isLiked = userDoc.likedSongs.some(
      (id) => id.toString() === songId
    );

    if (isLiked) {
      // Unlike: remove from liked songs
      userDoc.likedSongs = userDoc.likedSongs.filter(
        (id) => id.toString() !== songId
      );
      await userDoc.save();

      return NextResponse.json(
        {
          success: true,
          message: "Song unliked",
          isLiked: false,
        },
        { status: 200 }
      );
    } else {
      // Like: add to liked songs
      userDoc.likedSongs.push(songObjectId);
      await userDoc.save();

      return NextResponse.json(
        {
          success: true,
          message: "Song liked",
          isLiked: true,
        },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("Like song error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to like/unlike song" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/songs/like?userId=xxx
 * Get user's liked songs
 */
export async function GET(request: NextRequest) {
  try {
    const { user, error } = await authenticateUser(request);
    if (error || !user) {
      return NextResponse.json(
        { success: false, error: error || "Authentication required" },
        { status: 401 }
      );
    }

    await connectDB();

    const userDoc = await User.findById(user.id).populate("likedSongs");
    if (!userDoc) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Convert to plain objects
    const likedSongs = userDoc.likedSongs.map((song) => song.toObject());

    return NextResponse.json(
      {
        success: true,
        data: likedSongs,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get liked songs error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to get liked songs" },
      { status: 500 }
    );
  }
}

