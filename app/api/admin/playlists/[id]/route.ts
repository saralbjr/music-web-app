import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Playlist from '@/models/Playlist';
import { requireAdmin } from '@/lib/middleware/auth';
import mongoose from 'mongoose';

/**
 * GET /api/admin/playlists/[id]
 * Get a specific playlist by ID (Admin only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check admin authentication
    const { response } = await requireAdmin(request);
    if (response) return response;

    await connectDB();

    const { id } = params;

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid playlist ID' },
        { status: 400 }
      );
    }

    const playlist = await Playlist.findById(id)
      .populate('userId', 'name email')
      .populate('songs');

    if (!playlist) {
      return NextResponse.json(
        { success: false, error: 'Playlist not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: playlist }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch playlist' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/playlists/[id]
 * Update a playlist by ID (Admin only)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check admin authentication
    const { response } = await requireAdmin(request);
    if (response) return response;

    await connectDB();

    const { id } = params;

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid playlist ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, songs, userId } = body;

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (songs !== undefined) updateData.songs = songs;
    if (userId !== undefined) {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return NextResponse.json(
          { success: false, error: 'Invalid user ID' },
          { status: 400 }
        );
      }
      updateData.userId = userId;
    }

    const playlist = await Playlist.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate('userId', 'name email')
      .populate('songs');

    if (!playlist) {
      return NextResponse.json(
        { success: false, error: 'Playlist not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: playlist }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to update playlist' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/playlists/[id]
 * Delete a playlist by ID (Admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check admin authentication
    const { response } = await requireAdmin(request);
    if (response) return response;

    await connectDB();

    const { id } = params;

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid playlist ID' },
        { status: 400 }
      );
    }

    const deletedPlaylist = await Playlist.findByIdAndDelete(id);

    if (!deletedPlaylist) {
      return NextResponse.json(
        { success: false, error: 'Playlist not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Playlist deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to delete playlist' },
      { status: 500 }
    );
  }
}

