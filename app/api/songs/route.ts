import { NextRequest, NextResponse } from 'next/server';
import { mergeSort } from '@/lib/algorithms/mergeSort';
import { kmpMatch } from '@/lib/algorithms/kmp';
import connectDB from '@/lib/db';
import Song from '@/models/Song';
import { requireAdmin } from '@/lib/middleware/auth';

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
    let songs = await Song.find({});
    songs = songs.map((song) => song.toObject());

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const order = (searchParams.get('order') || 'desc') as 'asc' | 'desc';
    const category = searchParams.get('category') || '';
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');

    // Apply category filter
    if (category) {
      songs = songs.filter(
        (song) => song.category.toLowerCase() === category.toLowerCase()
      );
    }

    // Apply KMP search if search query is provided
    if (search) {
      songs = songs.filter(
        (song) => kmpMatch(song.title, search) || kmpMatch(song.artist, search)
      );
    }

    // Apply merge sort
    const sortedSongs = mergeSort(songs, sortBy as keyof typeof songs[0], order);

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
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch songs' },
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
    const { title, artist, duration, audioUrl, coverUrl, category } = body;

    // Validate required fields
    if (!title || !artist || !duration || !audioUrl || !coverUrl || !category) {
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Use MongoDB
    await connectDB();
    const song = await Song.create({
      title,
      artist,
      duration,
      audioUrl,
      coverUrl,
      category,
      playCount: 0,
    });

    return NextResponse.json({ success: true, data: song }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create song' },
      { status: 500 }
    );
  }
}
