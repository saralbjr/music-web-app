/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { authenticateUser } from "@/lib/middleware/auth";

function authError(message: string) {
  return NextResponse.json({ success: false, error: message }, { status: 401 });
}

function toResponseUser(user: any) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    image: user.image,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await authenticateUser(request);
    if (error || !user) {
      return authError(error || "Authentication required");
    }

    await connectDB();
    const userDoc = await User.findById(user.id).select("-password");

    if (!userDoc) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, data: toResponseUser(userDoc) },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { user, error } = await authenticateUser(request);
    if (error || !user) {
      return authError(error || "Authentication required");
    }

    await connectDB();

    const body = await request.json();
    const { name, image } = body;

    const userDoc = await User.findById(user.id);
    if (!userDoc) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    if (typeof name === "string" && name.trim()) {
      userDoc.name = name.trim();
    }

    if (typeof image === "string") {
      userDoc.image = image.trim();
    }

    await userDoc.save();

    return NextResponse.json(
      { success: true, data: toResponseUser(userDoc) },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to update profile" },
      { status: 500 }
    );
  }
}
