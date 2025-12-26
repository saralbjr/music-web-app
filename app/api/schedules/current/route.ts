import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Schedule, { ISchedule } from "@/models/Schedule";
import { authenticateUser } from "@/lib/middleware/auth";
import { findBestSchedule } from "@/lib/algorithms/scheduling";

/**
 * GET /api/schedules/current
 *
 * Get the currently active schedule based on scheduling algorithm
 *
 * Computer Science Concept: Scheduling Algorithm Execution
 * - Uses Priority Scheduling to find the best matching schedule
 * - Applies Time-Based Scheduling to match current time
 * - Implements Greedy Algorithm to select highest priority match
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

    const schedules = await Schedule.find({ userId: user.id, isActive: true })
      .populate("playlistId")
      .lean<ISchedule[]>();

    // Apply scheduling algorithm to find best matching schedule
    const bestSchedule = findBestSchedule(schedules);

    return NextResponse.json(
      {
        success: true,
        data: bestSchedule,
        hasActiveSchedule: bestSchedule !== null,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Get current schedule error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to get current schedule",
      },
      { status: 500 }
    );
  }
}



