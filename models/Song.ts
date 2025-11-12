import mongoose, { Schema, Document, Model } from "mongoose";

/**
 * Song Interface
 * Defines the structure of a song document
 */
export interface ISong extends Document {
  title: string;
  artist: string;
  duration: number; // Duration in seconds
  audioUrl: string; // Path to MP3 file
  coverUrl: string; // Path to cover image
  category: string; // Genre/category of the song
  playCount: number; // Number of times the song has been played
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
    audioUrl: {
      type: String,
      required: [true, "Audio URL is required"],
    },
    coverUrl: {
      type: String,
      required: [true, "Cover image URL is required"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
    },
    playCount: {
      type: Number,
      default: 0,
      min: [0, "Play count must be positive"],
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
