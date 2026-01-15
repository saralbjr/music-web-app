import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Song, { Category } from "@/models/Song";
import { requireAdmin } from "@/lib/middleware/auth";
import { estimateAudioFeaturesFromCategory } from "@/lib/algorithms/audioFeatures";
import { detectMoodFromAudioFeatures } from "@/lib/algorithms/moodDetection";

/**
 * GET /api/admin/songs
 * Get all songs with pagination and search (Admin only)
 */
export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const { response } = await requireAdmin(request);
    if (response) return response;

    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const search = searchParams.get("search") || "";

    // Build query
    const query: Record<string, unknown> = {};
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { artist: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
      ];
    }

    // Get songs
    const songs = await Song.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset);

    // Get total count
    const total = await Song.countDocuments(query);

    return NextResponse.json(
      {
        success: true,
        data: songs,
        total,
        limit,
        offset,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch songs",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/songs
 * Create a new song (Admin only)
 */
export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const { response } = await requireAdmin(request);
    if (response) return response;

    await connectDB();

    const body = await request.json();
    const { title, artist, duration, audioFile, coverFile, category } = body;

    // Validate required fields
    if (
      !title ||
      !artist ||
      !duration ||
      !audioFile ||
      !coverFile ||
      !category
    ) {
      return NextResponse.json(
        { success: false, error: "All fields are required" },
        { status: 400 }
      );
    }

    // Validate category is a valid enum value
    const validCategories: Category[] = [
      "Pop",
      "Rock",
      "Hip Hop",
      "Jazz",
      "Electronic",
      "Classical",
      "Country",
      "R&B",
    ];
    if (!validCategories.includes(category as Category)) {
      return NextResponse.json(
        { success: false, error: "Invalid category" },
        { status: 400 }
      );
    }

    // Automatically estimate audio features from category
    const { tempo, energy, valence } = estimateAudioFeaturesFromCategory(
      category as Category
    );

    // Automatically classify mood from audio features
    const mood = detectMoodFromAudioFeatures(tempo, energy, valence);

    // Create song with automatically determined audio features and mood
    const song = await Song.create({
      title,
      artist,
      duration,
      audioFile,
      coverFile,
      category: category as Category,
      playCount: 0,
      tempo,
      energy,
      valence,
      mood, // Automatically classified - no user input required
    });

    return NextResponse.json({ success: true, data: song }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create song",
      },
      { status: 500 }
    );
  }
}
