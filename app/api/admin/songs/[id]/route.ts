import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Song from '@/models/Song';
import { requireAdmin } from '@/lib/middleware/auth';
import mongoose from 'mongoose';

/**
 * GET /api/admin/songs/[id]
 * Get a specific song by ID (Admin only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check admin authentication
    const { user, error, response } = await requireAdmin(request);
    if (response) return response;

    await connectDB();

    const { id } = params;

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid song ID' },
        { status: 400 }
      );
    }

    const song = await Song.findById(id);

    if (!song) {
      return NextResponse.json(
        { success: false, error: 'Song not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: song }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch song' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/songs/[id]
 * Update a song by ID (Admin only)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check admin authentication
    const { user, error, response } = await requireAdmin(request);
    if (response) return response;

    await connectDB();

    const { id } = params;

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid song ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { title, artist, duration, audioUrl, coverUrl, category } = body;

    const song = await Song.findByIdAndUpdate(
      id,
      { title, artist, duration, audioUrl, coverUrl, category },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!song) {
      return NextResponse.json(
        { success: false, error: 'Song not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: song }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update song' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/songs/[id]
 * Delete a song by ID (Admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check admin authentication
    const { user, error, response } = await requireAdmin(request);
    if (response) return response;

    await connectDB();

    const { id } = params;

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid song ID' },
        { status: 400 }
      );
    }

    const deletedSong = await Song.findByIdAndDelete(id);

    if (!deletedSong) {
      return NextResponse.json(
        { success: false, error: 'Song not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Song deleted successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete song' },
      { status: 500 }
    );
  }
}

