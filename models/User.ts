import mongoose, { Schema, Document, Model } from "mongoose";

/**
 * User Interface
 * Defines the structure of a user document
 */
export interface IUser extends Document {
  name: string;
  email: string;
  password: string; // Hashed password
  role: "admin" | "user"; // User role
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User Schema
 * Mongoose schema definition for users with timestamps
 */
const UserSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
    },
    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
      required: true,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

// Create model if it doesn't exist, otherwise use existing model
const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
