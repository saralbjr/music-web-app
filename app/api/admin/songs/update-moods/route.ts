import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Song, { Category } from "@/models/Song";
import { requireAdmin } from "@/lib/middleware/auth";
import { estimateAudioFeaturesFromCategory } from "@/lib/algorithms/audioFeatures";
import { detectMoodFromAudioFeatures } from "@/lib/algorithms/moodDetection";

/**
 * POST /api/admin/songs/update-moods
 *
 * Admin endpoint to update all existing songs with audio features and moods
 * This is a convenience endpoint that can be called from the admin panel
 *
 * Query Parameters:
 * - updateAll: If true, updates all songs (even those with existing mood). Default: true
 * - updateFeatures: If true, also estimates and updates audio features. Default: true
 */
export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const { response } = await requireAdmin(request);
    if (response) return response;

    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const updateAll = searchParams.get("updateAll") !== "false"; // Default: true
    const updateFeatures = searchParams.get("updateFeatures") !== "false"; // Default: true

    // Find songs to update
    const query = updateAll
      ? {} // Update all songs
      : {
          $or: [{ mood: { $exists: false } }, { mood: null }],
        };

    const songsToUpdate = await Song.find(query);

    if (songsToUpdate.length === 0) {
      return NextResponse.json(
        {
          success: true,
          message: "No songs to update",
          updated: 0,
          featuresUpdated: 0,
        },
        { status: 200 }
      );
    }

    let updated = 0;
    let featuresUpdated = 0;
    const errors: string[] = [];

    // Process each song
    for (const song of songsToUpdate) {
      try {
        const updateData: Record<string, unknown> = {};

        // Estimate and update audio features if requested
        if (updateFeatures && song.category) {
          try {
            const { tempo, energy, valence } =
              estimateAudioFeaturesFromCategory(song.category as Category);
            updateData.tempo = tempo;
            updateData.energy = energy;
            updateData.valence = valence;
            featuresUpdated++;
          } catch (err) {
            errors.push(
              `Failed to estimate features for song ${song._id}: ${
                err instanceof Error ? err.message : String(err)
              }`
            );
            continue;
          }
        }

        // Determine mood using audio features if available, otherwise category
        try {
          if (
            updateData.tempo !== undefined &&
            updateData.energy !== undefined &&
            updateData.valence !== undefined
          ) {
            // Use audio feature-based detection
            updateData.mood = detectMoodFromAudioFeatures(
              updateData.tempo as number,
              updateData.energy as number,
              updateData.valence as number
            );
          } else if (
            song.tempo !== undefined &&
            song.energy !== undefined &&
            song.valence !== undefined
          ) {
            // Use existing audio features
            updateData.mood = detectMoodFromAudioFeatures(
              song.tempo,
              song.energy,
              song.valence
            );
          } else {
            // Skip if no features available
            errors.push(`Song ${song._id} has no category or features`);
            continue;
          }
        } catch (err) {
          errors.push(
            `Failed to detect mood for song ${song._id}: ${
              err instanceof Error ? err.message : String(err)
            }`
          );
          continue;
        }

        // Update the song
        await Song.findByIdAndUpdate(song._id, updateData);
        updated++;
      } catch (err) {
        errors.push(
          `Error updating song ${song._id}: ${
            err instanceof Error ? err.message : String(err)
          }`
        );
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: `Updated ${updated} songs${
          featuresUpdated > 0 ? ` (${featuresUpdated} with audio features)` : ""
        }`,
        updated,
        featuresUpdated,
        total: songsToUpdate.length,
        errors: errors.length > 0 ? errors.slice(0, 10) : undefined, // Return first 10 errors
        errorCount: errors.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Bulk mood update error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to update songs",
      },
      { status: 500 }
    );
  }
}
