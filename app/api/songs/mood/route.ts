import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Song, { ISong } from "@/models/Song";
import { authenticateUser } from "@/lib/middleware/auth";
import { detectMoodFromCategory, Mood } from "@/lib/algorithms/moodDetection";

/**
 * GET /api/songs/mood
 *
 * Mood-Based Music Recommendation API
 *
 * Computer Science Concepts:
 * - Content-Based Filtering: Recommends songs based on mood attribute
 * - Rule-Based Classification: Uses mood detection algorithm
 * - Query Filtering: Simple database query with mood filter
 *
 * Query Parameters:
 * - mood: The mood to filter by (Happy, Sad, Relaxed, Focused)
 * - limit: Number of songs to return (default: 20)
 * - autoDetect: If true, auto-detect mood for songs that don't have one (default: true)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const moodParam = searchParams.get("mood");
    const limitParam = searchParams.get("limit");
    const autoDetectParam = searchParams.get("autoDetect");

    // Validate mood parameter
    const validMoods: Mood[] = ["Happy", "Sad", "Relaxed", "Focused"];
    if (!moodParam || !validMoods.includes(moodParam as Mood)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid mood. Must be one of: ${validMoods.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const mood = moodParam as Mood;
    const limit = limitParam ? Math.max(1, parseInt(limitParam, 10)) : 20;
    const autoDetect = autoDetectParam !== "false"; // Default to true

    // Authentication is optional but recommended for personalized results
    await authenticateUser(request).catch(() => {
      // Continue without auth if token is invalid
    });

    await connectDB();

    // Fetch songs with the specified mood
    const songs = await Song.find({ mood }).limit(limit).lean<ISong[]>();

    // If auto-detect is enabled and we don't have enough songs, detect mood for songs without it
    if (autoDetect && songs.length < limit) {
      // Fetch songs without mood assigned
      const songsWithoutMood = await Song.find({
        $or: [{ mood: { $exists: false } }, { mood: null }],
      })
        .limit(limit * 2)
        .lean<ISong[]>();

      // Auto-detect mood for songs without one
      for (const song of songsWithoutMood) {
        const detectedMood = detectMoodFromCategory(song.category || "");
        if (detectedMood === mood) {
          songs.push(song);
          // Update the song in database (optional, can be done async)
          Song.findByIdAndUpdate(song._id, { mood: detectedMood }).catch(
            (err) => console.error("Error updating song mood:", err)
          );
        }
        if (songs.length >= limit) break;
      }
    }

    // Sort by playCount (popularity) for better recommendations
    songs.sort((a, b) => (b.playCount || 0) - (a.playCount || 0));

    // Limit results
    const limitedSongs = songs.slice(0, limit);

    return NextResponse.json(
      {
        success: true,
        data: limitedSongs,
        total: limitedSongs.length,
        mood,
        limit,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Mood recommendation error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch mood-based recommendations",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/songs/mood
 *
 * Bulk mood assignment endpoint
 * Auto-detects and assigns mood to songs that don't have one
 *
 * Computer Science Concept: Batch Processing
 */
export async function POST(request: NextRequest) {
  try {
    const { response } = await authenticateUser(request);
    if (response) {
      return response;
    }

    await connectDB();

    // Find all songs without mood
    const songsWithoutMood = await Song.find({
      $or: [{ mood: { $exists: false } }, { mood: null }],
    }).lean<ISong[]>();

    let updated = 0;
    const { detectMoodFromCategory } = await import(
      "@/lib/algorithms/moodDetection"
    );

    // Assign mood to each song using rule-based detection
    for (const song of songsWithoutMood) {
      const detectedMood = detectMoodFromCategory(song.category || "");
      await Song.findByIdAndUpdate(song._id, { mood: detectedMood });
      updated++;
    }

    return NextResponse.json(
      {
        success: true,
        message: `Assigned mood to ${updated} songs`,
        updated,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Bulk mood assignment error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to assign moods",
      },
      { status: 500 }
    );
  }
}



