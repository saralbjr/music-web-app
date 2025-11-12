import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { ISong } from './Song';

/**
 * Playlist Interface
 * Defines the structure of a playlist document
 */
export interface IPlaylist extends Document {
  name: string;
  userId: Types.ObjectId; // Reference to User
  songs: Types.ObjectId[]; // Array of Song references
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Playlist Schema
 * Mongoose schema definition for playlists with timestamps
 */
const PlaylistSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Playlist name is required'],
      trim: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    songs: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Song',
      },
    ],
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

// Create model if it doesn't exist, otherwise use existing model
const Playlist: Model<IPlaylist> =
  mongoose.models.Playlist || mongoose.model<IPlaylist>('Playlist', PlaylistSchema);

export default Playlist;

