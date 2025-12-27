import { NextRequest, NextResponse } from "next/server";
import { verifyToken, extractTokenFromHeader } from "@/lib/jwt";
import connectDB from "@/lib/db";
import User, { IUser } from "@/models/User";

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    email: string;
    role: "admin" | "user";
  };
}

/**
 * Middleware to verify JWT token and attach user to request
 */
export async function authenticateUser(request: NextRequest): Promise<{
  user: { id: string; email: string; role: "admin" | "user" } | null;
  error: string | null;
}> {
  try {
    const authHeader = request.headers.get("authorization");
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return { user: null, error: "No token provided" };
    }

    const decoded = verifyToken(token);
    await connectDB();

    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      return { user: null, error: "User not found" };
    }

    return {
      user: {
        id: String(user._id || user.id),
        email: user.email,
        role: user.role,
      },
      error: null,
    };
  } catch (error) {
    return {
      user: null,
      error: error instanceof Error ? error.message : "Authentication failed",
    };
  }
}

/**
 * Middleware to check if user is admin
 */
export async function requireAdmin(request: NextRequest): Promise<{
  user: { id: string; email: string; role: "admin" | "user" } | null;
  error: string | null;
  response: NextResponse | null;
}> {
  const { user, error } = await authenticateUser(request);

  if (error || !user) {
    return {
      user: null,
      error: error || "Authentication required",
      response: NextResponse.json(
        { success: false, error: error || "Authentication required" },
        { status: 401 }
      ),
    };
  }

  if (user.role !== "admin") {
    return {
      user: null,
      error: "Admin access required",
      response: NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      ),
    };
  }

  return { user, error: null, response: null };
}
