import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Song, { Category } from "@/models/Song";
import { requireAdmin } from "@/lib/middleware/auth";
import mongoose from "mongoose";
import { estimateAudioFeaturesFromCategory } from "@/lib/algorithms/audioFeatures";
import { detectMoodFromAudioFeatures } from "@/lib/algorithms/moodDetection";

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
    const { response } = await requireAdmin(request);
    if (response) return response;

    await connectDB();

    const { id } = params;

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid song ID" },
        { status: 400 }
      );
    }

    const song = await Song.findById(id);

    if (!song) {
      return NextResponse.json(
        { success: false, error: "Song not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: song }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch song",
      },
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
    const { response } = await requireAdmin(request);
    if (response) return response;

    await connectDB();

    const { id } = params;

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid song ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { title, artist, duration, audioFile, coverFile, category } = body;

    // Prepare update data
    const updateData: Record<string, unknown> = {
      title,
      artist,
      duration,
      audioFile,
      coverFile,
      category,
    };

    // If category is provided, automatically estimate audio features and mood
    if (category) {
      try {
        const { tempo, energy, valence } = estimateAudioFeaturesFromCategory(
          category as Category
        );
        updateData.tempo = tempo;
        updateData.energy = energy;
        updateData.valence = valence;

        // Automatically classify mood from audio features
        updateData.mood = detectMoodFromAudioFeatures(tempo, energy, valence);
      } catch (err) {
        console.warn(
          "Failed to estimate audio features, using category-based mood:",
          err
        );
        // Fallback handled by assignMoodToSong if needed
      }
    }

    const song = await Song.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!song) {
      return NextResponse.json(
        { success: false, error: "Song not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: song }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update song",
      },
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
    const { response } = await requireAdmin(request);
    if (response) return response;

    await connectDB();

    const { id } = params;

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid song ID" },
        { status: 400 }
      );
    }

    const deletedSong = await Song.findByIdAndDelete(id);

    if (!deletedSong) {
      return NextResponse.json(
        { success: false, error: "Song not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Song deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete song",
      },
      { status: 500 }
    );
  }
}
