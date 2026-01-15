import { NextRequest, NextResponse } from "next/server";
import { mergeSort } from "@/lib/algorithms/mergeSort";
import { kmpMatch, calculateSearchScore } from "@/lib/algorithms/kmp";
import connectDB from "@/lib/db";
import Song, { Category } from "@/models/Song";
import { requireAdmin } from "@/lib/middleware/auth";
import { estimateAudioFeaturesFromCategory } from "@/lib/algorithms/audioFeatures";
import { detectMoodFromAudioFeatures } from "@/lib/algorithms/moodDetection";

type SongDTO = {
  _id: string;
  title: string;
  artist: string;
  duration: number;
  audioFile: string;
  coverFile: string;
  category: string;
  playCount: number;
  createdAt: Date;
  updatedAt: Date;
  searchScore?: number;
};

/**
 * GET /api/songs
 * Fetch all songs with optional filtering, sorting, and pagination
 *
 * Query Parameters:
 * - search: Search songs by title or artist (uses KMP algorithm)
 * - sortBy: Sort by field (title, artist, duration, playCount, createdAt) - default: createdAt
 * - order: Sort order (asc, desc) - default: desc
 * - category: Filter by category
 * - limit: Limit number of results
 * - offset: Skip number of results (for pagination)
 *
 * Examples:
 * GET /api/songs
 * GET /api/songs?search=rock
 * GET /api/songs?sortBy=playCount&order=desc
 * GET /api/songs?category=Pop&limit=10
 * GET /api/songs?search=jazz&sortBy=title&order=asc&limit=20&offset=0
 */
export async function GET(request: NextRequest) {
  try {
    // Use MongoDB
    await connectDB();
    const rawSongs = (await Song.find({})
      .lean<SongDTO>()
      .exec()) as unknown as SongDTO[];
    let songs: SongDTO[] = rawSongs.map((song) => ({
      ...song,
      _id: song?._id?.toString?.() ?? "",
    }));

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const order = (searchParams.get("order") || "desc") as "asc" | "desc";
    const category = searchParams.get("category") || "";
    const limitParam = searchParams.get("limit");
    const offsetParam = searchParams.get("offset");

    // Apply category filter
    if (category) {
      songs = songs.filter(
        (song) => song.category.toLowerCase() === category.toLowerCase()
      );
    }

    // Apply KMP search if search query is provided
    if (search) {
      songs = songs
        .filter(
          (song) =>
            kmpMatch(song.title, search) || kmpMatch(song.artist, search)
        )
        .map((song) => ({
          ...song,
          searchScore: calculateSearchScore(song, search),
        }))
        .sort((a, b) => (b.searchScore || 0) - (a.searchScore || 0));
    }

    // Apply merge sort (only if not searching, as search already sorts by relevance)
    const sortedSongs = search
      ? songs
      : mergeSort(songs, sortBy as keyof (typeof songs)[0], order);

    // Apply pagination
    const offset = offsetParam ? parseInt(offsetParam, 10) : 0;
    const limit = limitParam ? parseInt(limitParam, 10) : sortedSongs.length;
    const paginatedSongs = sortedSongs.slice(offset, offset + limit);

    return NextResponse.json(
      {
        success: true,
        data: paginatedSongs,
        total: sortedSongs.length,
        limit,
        offset,
      },
      { status: 200 }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch songs";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/songs
 * Create a new song
 */
export async function POST(request: NextRequest) {
  const { response } = await requireAdmin(request);
  if (response) {
    return response;
  }

  try {
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
      "Indie",
    ];
    if (!validCategories.includes(category as Category)) {
      return NextResponse.json(
        { success: false, error: "Invalid category" },
        { status: 400 }
      );
    }

    // Use MongoDB
    await connectDB();

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
    const message =
      error instanceof Error ? error.message : "Failed to create song";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
