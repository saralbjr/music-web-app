import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

/**
 * POST /api/upload
 * Handle file uploads (MP3 and images)
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File | null;
    const imageFile = formData.get('image') as File | null;

    const uploadsDir = join(process.cwd(), 'public', 'uploads');

    // Create uploads directory if it doesn't exist
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    const uploadedFiles: { audioUrl?: string; coverUrl?: string } = {};

    // Handle audio file upload
    if (audioFile) {
      const bytes = await audioFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const audioFileName = `${Date.now()}-${audioFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const audioPath = join(uploadsDir, audioFileName);

      await writeFile(audioPath, buffer);
      uploadedFiles.audioUrl = `/uploads/${audioFileName}`;
    }

    // Handle image file upload
    if (imageFile) {
      const bytes = await imageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const imageFileName = `${Date.now()}-${imageFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
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
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to upload files' },
      { status: 500 }
    );
  }
}

