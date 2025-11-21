import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Playlist from '@/models/Playlist';
import mongoose from 'mongoose';
import { authenticateUser } from '@/lib/middleware/auth';

/**
 * GET /api/playlists
 * Get all playlists for a user (requires userId query param)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ success: false, error: 'Invalid user ID' }, { status: 400 });
    }

    const { user, error } = await authenticateUser(request);
    if (error || !user) {
      return NextResponse.json(
        { success: false, error: error || 'Authentication required' },
        { status: 401 }
      );
    }

    if (user.id !== userId) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    await connectDB();

    const playlists = await Playlist.find({ userId }).populate('songs').sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: playlists }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch playlists' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/playlists
 * Create a new playlist
 */
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await authenticateUser(request);
    if (error || !user) {
      return NextResponse.json(
        { success: false, error: error || 'Authentication required' },
        { status: 401 }
      );
    }

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
      return NextResponse.json({ success: false, error: 'Invalid user ID' }, { status: 400 });
    }

    if (user.id !== userId) {
      return NextResponse.json(
        { success: false, error: 'Cannot create playlists for another user' },
        { status: 403 }
      );
    }

    await connectDB();

    const playlist = await Playlist.create({
      name,
      userId,
      songs,
    });

    const populatedPlaylist = await Playlist.findById(playlist._id).populate('songs');

    return NextResponse.json({ success: true, data: populatedPlaylist }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create playlist' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/playlists
 * Update a playlist (add/remove songs)
 */
export async function PUT(request: NextRequest) {
  try {
    const { user, error } = await authenticateUser(request);
    if (error || !user) {
      return NextResponse.json(
        { success: false, error: error || 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { playlistId, songs, name } = body;

    if (!playlistId) {
      return NextResponse.json(
        { success: false, error: 'Playlist ID is required' },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(playlistId)) {
      return NextResponse.json({ success: false, error: 'Invalid playlist ID' }, { status: 400 });
    }

    const updateData: any = {};
    if (songs !== undefined) {
      updateData.songs = songs;
    }
    if (name !== undefined) {
      updateData.name = name;
    }

    await connectDB();

    const existingPlaylist = await Playlist.findById(playlistId);
    if (!existingPlaylist) {
      return NextResponse.json({ success: false, error: 'Playlist not found' }, { status: 404 });
    }

    if (existingPlaylist.userId.toString() !== user.id) {
      return NextResponse.json(
        { success: false, error: 'You do not have permission to update this playlist' },
        { status: 403 }
      );
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(playlistId, updateData, {
      new: true,
      runValidators: true,
    }).populate('songs');

    return NextResponse.json({ success: true, data: updatedPlaylist }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update playlist' },
      { status: 500 }
    );
  }
}

