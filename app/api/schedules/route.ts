import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Schedule, { ISchedule } from "@/models/Schedule";
import { authenticateUser } from "@/lib/middleware/auth";

/**
 * GET /api/schedules
 *
 * Get all schedules for the authenticated user
 *
 * Computer Science Concept: Data Retrieval with Filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { user, error } = await authenticateUser(request);

    if (!user || error) {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required",
        },
        { status: 401 }
      );
    }

    await connectDB();

    const schedules = await Schedule.find({ userId: user.id })
      .populate("playlistId")
      .sort({ priority: -1, createdAt: -1 })
      .lean<ISchedule[]>();

    return NextResponse.json(
      {
        success: true,
        data: schedules,
        total: schedules.length,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Get schedules error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch schedules",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/schedules
 *
 * Create a new schedule
 *
 * Computer Science Concept: Data Structure Creation
 */
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await authenticateUser(request);

    if (!user || error) {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required",
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      name,
      timeRange,
      daysOfWeek,
      type,
      playlistId,
      mood,
      priority,
      isActive,
    } = body;

    // Validation
    if (!name || !timeRange || !daysOfWeek || !type) {
      return NextResponse.json(
        {
          success: false,
          error: "Name, timeRange, daysOfWeek, and type are required",
        },
        { status: 400 }
      );
    }

    if (type === "playlist" && !playlistId) {
      return NextResponse.json(
        {
          success: false,
          error: "playlistId is required when type is 'playlist'",
        },
        { status: 400 }
      );
    }

    if (type === "mood" && !mood) {
      return NextResponse.json(
        {
          success: false,
          error: "mood is required when type is 'mood'",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const schedule = await Schedule.create({
      userId: user.id,
      name,
      timeRange,
      daysOfWeek,
      type,
      playlistId: type === "playlist" ? playlistId : undefined,
      mood: type === "mood" ? mood : undefined,
      priority: priority || 1,
      isActive: isActive !== undefined ? isActive : true,
    });

    return NextResponse.json(
      {
        success: true,
        data: schedule,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Create schedule error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to create schedule",
      },
      { status: 500 }
    );
  }
}
