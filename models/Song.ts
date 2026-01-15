import mongoose, { Schema, Document, Model } from "mongoose";

/**
 * Category Enum
 * Valid music categories/genres
 */
export type Category =
  | "Pop"
  | "Rock"
  | "Hip Hop"
  | "Jazz"
  | "Electronic"
  | "Classical"
  | "Country"
  | "R&B"
  | "Indie";

/**
 * Song Interface
 * Defines the structure of a song document
 */
export interface ISong extends Document {
  title: string;
  artist: string;
  duration: number; // Duration in seconds
  audioFile: string; // Path to uploaded MP3 file from device
  coverFile: string; // Path to uploaded cover image from device
  category: Category; // Genre/category of the song
  playCount: number; // Number of times the song has been played
  tempo?: number; // Beats per minute (BPM)
  energy?: number; // Energy level (0-1 scale)
  valence?: number; // Positivity/negativity (0-1 scale)
    mood?: string; // Mood classification: Happy, Sad, Relaxed, Focused
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Song Schema
 * Mongoose schema definition for songs with timestamps
 */
const SongSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Song title is required"],
      trim: true,
    },
    artist: {
      type: String,
      required: [true, "Artist name is required"],
      trim: true,
    },
    duration: {
      type: Number,
      required: [true, "Duration is required"],
      min: [0, "Duration must be positive"],
    },
    audioFile: {
      type: String,
      required: [true, "Audio file upload is required"],
    },
    coverFile: {
      type: String,
      required: [true, "Cover image file upload is required"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: [
        "Pop",
        "Rock",
        "Hip Hop",
        "Jazz",
        "Electronic",
        "Classical",
        "Country",
        "R&B",
        "Indie",
      ],
      trim: true,
    },
    playCount: {
      type: Number,
      default: 0,
      min: [0, "Play count must be positive"],
    },
    tempo: {
      type: Number,
      min: [0, "Tempo must be positive"],
    },
    energy: {
      type: Number,
      min: [0, "Energy must be between 0 and 1"],
      max: [1, "Energy must be between 0 and 1"],
    },
    valence: {
      type: Number,
      min: [0, "Valence must be between 0 and 1"],
      max: [1, "Valence must be between 0 and 1"],
    },
    mood: {
      type: String,
      enum: ["Happy", "Sad", "Relaxed", "Focused"],
      trim: true,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

// Create model if it doesn't exist, otherwise use existing model
const Song: Model<ISong> =
  mongoose.models.Song || mongoose.model<ISong>("Song", SongSchema);

export default Song;
