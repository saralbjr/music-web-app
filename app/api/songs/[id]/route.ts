import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Song, { Category } from "@/models/Song";
import mongoose from "mongoose";
import { estimateAudioFeaturesFromCategory } from "@/lib/algorithms/audioFeatures";
import { detectMoodFromAudioFeatures } from "@/lib/algorithms/moodDetection";

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

    // Increment play count
    song.playCount += 1;
    await song.save();

    return NextResponse.json(
      { success: true, data: song.toObject() },
      { status: 200 }
    );
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
      return NextResponse.json(
        { success: false, error: "Invalid song ID" },
        { status: 400 }
      );
    }

    // If category is being updated, automatically recalculate audio features and mood
    const updateData = { ...body };
    if (body.category) {
      try {
        const { tempo, energy, valence } = estimateAudioFeaturesFromCategory(
          body.category as Category
        );
        updateData.tempo = tempo;
        updateData.energy = energy;
        updateData.valence = valence;

        // Automatically classify mood from audio features
        updateData.mood = detectMoodFromAudioFeatures(tempo, energy, valence);
      } catch (err) {
        console.warn("Failed to estimate audio features during update:", err);
        // Continue with update, mood will be handled by fallback if needed
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

    return NextResponse.json(
      { success: true, data: song.toObject() },
      { status: 200 }
    );
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
      return NextResponse.json(
        { success: false, error: "Invalid song ID" },
        { status: 400 }
      );
    }
    const song = await Song.findByIdAndDelete(id);
    const deleted = !!song;

    if (!deleted) {
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
