import mongoose, { Schema, Document, Model, Types } from "mongoose";

/**
 * Schedule Interface
 * Defines the structure of a schedule document for time-based music playback
 *
 * Computer Science Concept: Scheduling Algorithms
 * - Time-Based Scheduling: Assigns playlists/moods to specific time ranges
 * - Priority Scheduling: Uses priority field to determine which schedule takes precedence
 */
export interface ISchedule extends Document {
  userId: Types.ObjectId; // Reference to User
  name: string; // Schedule name (e.g., "Morning Workout", "Evening Relaxation")
  timeRange: {
    start: string; // Time in HH:MM format (e.g., "06:00")
    end: string; // Time in HH:MM format (e.g., "08:00")
  };
  daysOfWeek: number[]; // Array of day numbers (0=Sunday, 1=Monday, ..., 6=Saturday)
  type: "playlist" | "mood"; // Type of schedule
  playlistId?: Types.ObjectId; // Reference to Playlist (if type is "playlist")
  mood?: string; // Mood value (if type is "mood")
  priority: number; // Priority level (higher number = higher priority)
  isActive: boolean; // Whether the schedule is currently active
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Schedule Schema
 * Mongoose schema definition for schedules with timestamps
 */
const ScheduleSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    name: {
      type: String,
      required: [true, "Schedule name is required"],
      trim: true,
    },
    timeRange: {
      start: {
        type: String,
        required: [true, "Start time is required"],
        match: [
          /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/,
          "Invalid time format (HH:MM)",
        ],
      },
      end: {
        type: String,
        required: [true, "End time is required"],
        match: [
          /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/,
          "Invalid time format (HH:MM)",
        ],
      },
    },
    daysOfWeek: {
      type: [Number],
      required: [true, "Days of week are required"],
      validate: {
        validator: (days: number[]) => {
          return days.length > 0 && days.every((day) => day >= 0 && day <= 6);
        },
        message: "Days must be between 0 (Sunday) and 6 (Saturday)",
      },
    },
    type: {
      type: String,
      enum: ["playlist", "mood"],
      required: [true, "Schedule type is required"],
    },
    playlistId: {
      type: Schema.Types.ObjectId,
      ref: "Playlist",
    },
    mood: {
      type: String,
      enum: ["Happy", "Sad", "Relaxed", "Focused"],
    },
    priority: {
      type: Number,
      default: 1,
      min: [1, "Priority must be at least 1"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

// Validation: Ensure either playlistId or mood is set based on type
ScheduleSchema.pre("validate", function (next) {
  if (this.type === "playlist" && !this.playlistId) {
    next(new Error("playlistId is required when type is 'playlist'"));
  } else if (this.type === "mood" && !this.mood) {
    next(new Error("mood is required when type is 'mood'"));
  } else {
    next();
  }
});

// Create model if it doesn't exist, otherwise use existing model
const Schedule: Model<ISchedule> =
  mongoose.models.Schedule ||
  mongoose.model<ISchedule>("Schedule", ScheduleSchema);

export default Schedule;

