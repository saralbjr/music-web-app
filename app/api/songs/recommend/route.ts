/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Song, { ISong } from "@/models/Song";
import User from "@/models/User";
import { authenticateUser } from "@/lib/middleware/auth";
import { getRecommendations } from "@/lib/algorithms/recommend";

/**
 * GET /api/songs/recommend
 * Returns a ranked list of recommended songs using the content-based
 * recommender in `lib/algorithms/recommend`.
 *
 * Signals:
 * - playCount (popularity)
 * - category preference (explicit via query or inferred from liked songs)
 *
 * Query Params:
 * - limit: number of items to return (default 10)
 * - category: optional user-preferred category/genre override
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limitParam = searchParams.get("limit");
    const categoryOverride = searchParams.get("category") || undefined;
    const genre = searchParams.get("genre") || undefined;
    const limit = limitParam ? Math.max(1, parseInt(limitParam, 10)) : 6;

    // Require auth so recommendations are always user-specific
    const { user, error } = await authenticateUser(request);

    if (!user || error) {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required for recommendations",
        },
        { status: 401 }
      );
    }

    await connectDB();

    // Fetch all songs (lean returns plain objects, cast via unknown for scorer)
    const rawSongs = await Song.find({}).lean();
    const songs = rawSongs as unknown as ISong[];

    // Nothing to recommend
    if (!songs.length) {
      return NextResponse.json(
        { success: true, data: [], total: 0, limit },
        { status: 200 }
      );
    }

    // Determine user category preference
    let userCategory = categoryOverride || genre;
    let likedIds: Set<string> | undefined;

    // At this point we always have an authenticated user
    const userDoc = await User.findById(user.id)
      .select("likedSongs")
      .populate("likedSongs");

    const likedSongs = (userDoc?.likedSongs || []) as any[];

    // If user has no liked songs yet, do not generate generic/global
    // recommendations. Frontend will show a first‑time UX card instead,
    // prompting them to listen to or like songs first.
    if (!likedSongs.length) {
      return NextResponse.json(
        {
          success: true,
          data: [],
          total: 0,
          limit,
          inferredCategory: null,
          needsInteraction: true,
        },
        { status: 200 }
      );
    }

    likedIds = new Set(
      likedSongs
        .map((song) => song?._id?.toString?.())
        .filter((id: string | undefined): id is string => Boolean(id))
    );

    if (!userCategory) {
      userCategory = deriveTopCategory(likedSongs);
    }

    // If a genre is provided, hard-filter to that category before scoring
    const filteredSongs =
      userCategory && (genre || categoryOverride)
        ? songs.filter(
            (song) =>
              song.category?.toLowerCase() === userCategory?.toLowerCase()
          )
        : songs;

    const recommended = getRecommendations(
      filteredSongs,
      userCategory,
      limit,
      likedIds
    );

    return NextResponse.json(
      {
        success: true,
        data: recommended,
        total: recommended.length,
        limit,
        inferredCategory: userCategory || null,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Recommendation error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch recommendations",
      },
      { status: 500 }
    );
  }
}

/**
 * Find the most frequent category from a user's liked songs.
 */
function deriveTopCategory(likedSongs: any[]): string | undefined {
  if (!likedSongs || !likedSongs.length) return undefined;

  const counts: Record<string, number> = {};
  for (const song of likedSongs) {
    const category = song?.category;
    if (!category || typeof category !== "string") continue;
    const normalized = category.toLowerCase();
    counts[normalized] = (counts[normalized] || 0) + 1;
  }

  const [topCategory] =
    Object.entries(counts).sort((a, b) => b[1] - a[1])[0] || [];

  return topCategory;
}
