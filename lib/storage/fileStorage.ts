import { writeFile, readFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { ISong } from '@/models/Song';

/**
 * File-based storage for songs (no database required)
 * Stores song metadata in a JSON file
 */

const STORAGE_FILE = join(process.cwd(), 'data', 'songs.json');

/**
 * Ensure data directory exists
 */
async function ensureDataDir() {
  const dataDir = join(process.cwd(), 'data');
  if (!existsSync(dataDir)) {
    await mkdir(dataDir, { recursive: true });
  }
}

/**
 * Read all songs from JSON file
 */
export async function readSongs(): Promise<ISong[]> {
  try {
    await ensureDataDir();
    if (!existsSync(STORAGE_FILE)) {
      return [];
    }
    const data = await readFile(STORAGE_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading songs:', error);
    return [];
  }
}

/**
 * Write songs to JSON file
 */
export async function writeSongs(songs: ISong[]): Promise<void> {
  try {
    await ensureDataDir();
    await writeFile(STORAGE_FILE, JSON.stringify(songs, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing songs:', error);
    throw error;
  }
}

/**
 * Add a new song
 */
export async function addSong(song: Omit<ISong, '_id' | 'createdAt' | 'updatedAt'>): Promise<ISong> {
  const songs = await readSongs();
  const newSong: ISong = {
    ...song,
    _id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` as any,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as ISong;

  songs.push(newSong);
  await writeSongs(songs);
  return newSong;
}

/**
 * Get a song by ID
 */
export async function getSongById(id: string): Promise<ISong | null> {
  const songs = await readSongs();
  return songs.find((s) => s._id.toString() === id) || null;
}

/**
 * Update a song
 */
export async function updateSong(id: string, updates: Partial<ISong>): Promise<ISong | null> {
  const songs = await readSongs();
  const index = songs.findIndex((s) => s._id.toString() === id);

  if (index === -1) {
    return null;
  }

  songs[index] = {
    ...songs[index],
    ...updates,
    updatedAt: new Date(),
  };

  await writeSongs(songs);
  return songs[index];
}

/**
 * Delete a song
 */
export async function deleteSong(id: string): Promise<boolean> {
  const songs = await readSongs();
  const index = songs.findIndex((s) => s._id.toString() === id);

  if (index === -1) {
    return false;
  }

  songs.splice(index, 1);
  await writeSongs(songs);
  return true;
}

