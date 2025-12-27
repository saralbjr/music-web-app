import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { parseBuffer } from "music-metadata";
import { requireAdmin } from "@/lib/middleware/auth";

/**
 * POST /api/upload
 * Handle file uploads (MP3 and images)
 */
export async function POST(request: NextRequest) {
  const { response } = await requireAdmin(request);
  if (response) {
    return response;
  }

  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File | null;
    const imageFile = formData.get("image") as File | null;

    const uploadsDir = join(process.cwd(), "public", "uploads");

    // Create uploads directory if it doesn't exist
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    const uploadedFiles: {
      audioUrl?: string;
      coverUrl?: string;
      duration?: number;
    } = {};

    // Handle audio file upload
    if (audioFile) {
      const bytes = await audioFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const audioFileName = `${Date.now()}-${audioFile.name.replace(
        /[^a-zA-Z0-9.-]/g,
        "_"
      )}`;
      const audioPath = join(uploadsDir, audioFileName);

      await writeFile(audioPath, buffer);
      uploadedFiles.audioUrl = `/uploads/${audioFileName}`;

      try {
        const metadata = await parseBuffer(buffer, {
          mimeType: audioFile.type || "audio/mpeg",
          size: audioFile.size,
        });
        if (metadata.format.duration) {
          uploadedFiles.duration = Math.round(metadata.format.duration);
        }
      } catch (durationError) {
        console.warn("Failed to extract duration from audio file:", durationError);
      }
    }

    // Handle image file upload
    if (imageFile) {
      const bytes = await imageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const imageFileName = `${Date.now()}-${imageFile.name.replace(
        /[^a-zA-Z0-9.-]/g,
        "_"
      )}`;
      const imagePath = join(uploadsDir, imageFileName);

      await writeFile(imagePath, buffer);
      uploadedFiles.coverUrl = `/uploads/${imageFileName}`;
    }

    return NextResponse.json(
      {
        success: true,
        data: uploadedFiles,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to upload files" },
      { status: 500 }
    );
  }
}

