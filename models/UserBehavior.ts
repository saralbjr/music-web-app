import mongoose, { Schema, Document, Model, Types } from "mongoose";

/**
 * User Behavior Interface
 * Tracks user interactions with songs for analytics
 *
 * Computer Science Concepts:
 * - Data Mining: Collects user interaction data
 * - Pattern Recognition: Enables analysis of user behavior patterns
 * - User Profiling: Builds user preference profiles
 */
export interface IUserBehavior extends Document {
  userId: Types.ObjectId; // Reference to User
  songId: Types.ObjectId; // Reference to Song
  action: "play" | "pause" | "skip" | "repeat" | "like" | "unlike"; // Type of interaction
  listenDuration?: number; // Duration listened in seconds (for play actions)
  timestamp: Date; // When the action occurred
  timeOfDay?: number; // Hour of day (0-23) for pattern analysis
  dayOfWeek?: number; // Day of week (0-6) for pattern analysis
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User Behavior Schema
 * Mongoose schema definition for user behavior tracking
 *
 * Indexes are added for efficient querying:
 * - userId + timestamp: For user-specific analytics
 * - songId + action: For song-specific analytics
 * - timestamp: For time-based pattern analysis
 */
const UserBehaviorSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    songId: {
      type: Schema.Types.ObjectId,
      ref: "Song",
      required: [true, "Song ID is required"],
      index: true,
    },
    action: {
      type: String,
      enum: ["play", "pause", "skip", "repeat", "like", "unlike"],
      required: [true, "Action is required"],
      index: true,
    },
    listenDuration: {
      type: Number,
      min: [0, "Listen duration must be positive"],
    },
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
      index: true,
    },
    timeOfDay: {
      type: Number,
      min: [0, "Time of day must be between 0 and 23"],
      max: [23, "Time of day must be between 0 and 23"],
    },
    dayOfWeek: {
      type: Number,
      min: [0, "Day of week must be between 0 and 6"],
      max: [6, "Day of week must be between 0 and 6"],
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

// Compound index for efficient queries
UserBehaviorSchema.index({ userId: 1, timestamp: -1 });
UserBehaviorSchema.index({ songId: 1, action: 1 });
UserBehaviorSchema.index({ userId: 1, action: 1 });

// Create model if it doesn't exist, otherwise use existing model
const UserBehavior: Model<IUserBehavior> =
  mongoose.models.UserBehavior ||
  mongoose.model<IUserBehavior>("UserBehavior", UserBehaviorSchema);

export default UserBehavior;



