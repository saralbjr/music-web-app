import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { authenticateUser } from "@/lib/middleware/auth";

/**
 * POST /api/playlists/upload-cover
 * Handle playlist cover image uploads (for regular users)
 */
export async function POST(request: NextRequest) {
  const { user, error } = await authenticateUser(request);
  if (error || !user) {
    return NextResponse.json(
      { success: false, error: error || "Authentication required" },
      { status: 401 }
    );
  }

  try {
    const formData = await request.formData();
    const imageFile = formData.get("image") as File | null;

    if (!imageFile) {
      return NextResponse.json(
        { success: false, error: "No image file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!imageFile.type.startsWith("image/")) {
      return NextResponse.json(
        { success: false, error: "File must be an image" },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    if (imageFile.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: "Image file size must be less than 5MB" },
        { status: 400 }
      );
    }

    const uploadsDir = join(process.cwd(), "public", "uploads");

    // Create uploads directory if it doesn't exist
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    const bytes = await imageFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const imageFileName = `${Date.now()}-${imageFile.name.replace(
      /[^a-zA-Z0-9.-]/g,
      "_"
    )}`;
    const imagePath = join(uploadsDir, imageFileName);

    await writeFile(imagePath, buffer);

    return NextResponse.json(
      {
        success: true,
        data: {
          coverUrl: `/uploads/${imageFileName}`,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to upload image" },
      { status: 500 }
    );
  }
}












