import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Playlist from '@/models/Playlist';
import { requireAdmin } from '@/lib/middleware/auth';
import mongoose from 'mongoose';

/**
 * GET /api/admin/playlists
 * Get all playlists with pagination and search (Admin only)
 */
export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const { user, error, response } = await requireAdmin(request);
    if (response) return response;

    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const search = searchParams.get('search') || '';

    // Build query
    let query: any = {};
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    // Get playlists with populated user and songs
    const playlists = await Playlist.find(query)
      .populate('userId', 'name email')
      .populate('songs')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset);

    // Get total count
    const total = await Playlist.countDocuments(query);

    return NextResponse.json(
      {
        success: true,
        data: playlists,
        total,
        limit,
        offset,
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch playlists' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/playlists
 * Create a new playlist (Admin only)
 */
export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const { user, error, response } = await requireAdmin(request);
    if (response) return response;

    await connectDB();

    const body = await request.json();
    const { name, userId, songs = [] } = body;

    // Validate required fields
    if (!name || !userId) {
      return NextResponse.json(
        { success: false, error: 'Playlist name and user ID are required' },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    const playlist = await Playlist.create({
      name,
      userId,
      songs,
    });

    const populatedPlaylist = await Playlist.findById(playlist._id)
      .populate('userId', 'name email')
      .populate('songs');

    return NextResponse.json(
      { success: true, data: populatedPlaylist },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create playlist' },
      { status: 500 }
    );
  }
}

