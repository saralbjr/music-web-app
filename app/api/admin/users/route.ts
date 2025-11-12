import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { requireAdmin } from '@/lib/middleware/auth';
import bcrypt from 'bcryptjs';

/**
 * GET /api/admin/users
 * Get all users (Admin only)
 * Query parameters:
 * - limit: Number of users to return (default: 10)
 * - offset: Number of users to skip (default: 0)
 * - search: Search by name or email
 */
export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const { user, error, response } = await requireAdmin(request);
    if (response) return response;

    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const search = searchParams.get('search') || '';

    // Build query
    let query: any = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    // Get users (excluding passwords)
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset);

    // Get total count
    const total = await User.countDocuments(query);

    return NextResponse.json(
      {
        success: true,
        data: users,
        total,
        limit,
        offset,
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/users
 * Create a new user (Admin only)
 */
export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const { user, error, response } = await requireAdmin(request);
    if (response) return response;

    await connectDB();

    const body = await request.json();
    const { name, email, password, role } = body;

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    // Validate role if provided
    if (role && !['admin', 'user'].includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Role must be either "admin" or "user"' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || 'user',
    });

    // Remove password from response
    const userResponse = {
      id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      createdAt: newUser.createdAt,
      updatedAt: newUser.updatedAt,
    };

    return NextResponse.json(
      { success: true, data: userResponse },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create user' },
      { status: 500 }
    );
  }
}

