import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Schedule from "@/models/Schedule";
import { authenticateUser } from "@/lib/middleware/auth";
import mongoose from "mongoose";

/**
 * PUT /api/schedules/[id]
 *
 * Update a schedule
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid schedule ID",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const schedule = await Schedule.findById(params.id);

    if (!schedule) {
      return NextResponse.json(
        {
          success: false,
          error: "Schedule not found",
        },
        { status: 404 }
      );
    }

    // Check ownership
    if (schedule.userId.toString() !== user.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 403 }
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

    // Update fields
    if (name !== undefined) schedule.name = name;
    if (timeRange !== undefined) schedule.timeRange = timeRange;
    if (daysOfWeek !== undefined) schedule.daysOfWeek = daysOfWeek;
    if (type !== undefined) schedule.type = type;
    if (playlistId !== undefined) schedule.playlistId = playlistId;
    if (mood !== undefined) schedule.mood = mood;
    if (priority !== undefined) schedule.priority = priority;
    if (isActive !== undefined) schedule.isActive = isActive;

    await schedule.save();

    return NextResponse.json(
      {
        success: true,
        data: schedule,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Update schedule error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to update schedule",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/schedules/[id]
 *
 * Delete a schedule
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid schedule ID",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const schedule = await Schedule.findById(params.id);

    if (!schedule) {
      return NextResponse.json(
        {
          success: false,
          error: "Schedule not found",
        },
        { status: 404 }
      );
    }

    // Check ownership
    if (schedule.userId.toString() !== user.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 403 }
      );
    }

    await Schedule.findByIdAndDelete(params.id);

    return NextResponse.json(
      {
        success: true,
        message: "Schedule deleted successfully",
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Delete schedule error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to delete schedule",
      },
      { status: 500 }
    );
  }
}



