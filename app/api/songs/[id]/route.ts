import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Song from '@/models/Song';
import mongoose from 'mongoose';

/**
 * GET /api/songs/[id]
 * Get a single song by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Use MongoDB
    await connectDB();
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Invalid song ID' }, { status: 400 });
    }
    const song = await Song.findById(id);

    if (!song) {
      return NextResponse.json({ success: false, error: 'Song not found' }, { status: 404 });
    }

    // Increment play count
    song.playCount += 1;
    await song.save();

    return NextResponse.json({ success: true, data: song.toObject() }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch song' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/songs/[id]
 * Update a song by ID
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    // Use MongoDB
    await connectDB();
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Invalid song ID' }, { status: 400 });
    }
    const song = await Song.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });

    if (!song) {
      return NextResponse.json({ success: false, error: 'Song not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: song.toObject() }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to update song' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/songs/[id]
 * Delete a song by ID
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Use MongoDB
    await connectDB();
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Invalid song ID' }, { status: 400 });
    }
    const song = await Song.findByIdAndDelete(id);
    const deleted = !!song;

    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Song not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Song deleted successfully' }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to delete song' },
      { status: 500 }
    );
  }
}
