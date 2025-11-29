import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware/auth";
import connectDB from "@/lib/db";
import User from "@/models/User";

/**
 * GET /api/admin/verify
 * Verify if the current user has admin access
 */
export async function GET(request: NextRequest) {
  try {
    const { user, error, response } = await requireAdmin(request);
    if (response) {
      return response;
    }

    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      );
    }

    // Fetch full user data including name
    await connectDB();
    const fullUser = await User.findById(user.id).select("-password");

    if (!fullUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        user: {
          id: fullUser._id.toString(),
          email: fullUser.email,
          name: fullUser.name,
          role: fullUser.role,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Verification failed" },
      { status: 500 }
    );
  }
}


