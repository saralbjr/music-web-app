import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { requireAdmin } from '@/lib/middleware/auth';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

/**
 * GET /api/admin/users/[id]
 * Get a specific user by ID (Admin only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check admin authentication
    const { response } = await requireAdmin(request);
    if (response) return response;

    await connectDB();

    const { id } = params;

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    const userData = await User.findById(id).select('-password');

    if (!userData) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, data: userData },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/users/[id]
 * Update a user by ID (Admin only)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check admin authentication
    const { response } = await requireAdmin(request);
    if (response) return response;

    await connectDB();

    const { id } = params;

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, email, password, role, image } = body;

    // Find user
    const userData = await User.findById(id);
    if (!userData) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Validate role if provided
    if (role && !['admin', 'user'].includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Role must be either "admin" or "user"' },
        { status: 400 }
      );
    }

    // Update fields
    if (name) userData.name = name;
    if (email) {
      // Check if email is already taken by another user
      const existingUser = await User.findOne({ email, _id: { $ne: id } });
      if (existingUser) {
        return NextResponse.json(
          { success: false, error: 'Email is already taken' },
          { status: 400 }
        );
      }
      userData.email = email;
    }
    if (password) {
      userData.password = await bcrypt.hash(password, 10);
    }
    if (role) userData.role = role;
    if (typeof image === 'string') {
      userData.image = image.trim();
    }

    await userData.save();

    // Remove password from response
    const userResponse = {
      id: userData._id,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      image: userData.image,
      createdAt: userData.createdAt,
      updatedAt: userData.updatedAt,
    };

    return NextResponse.json(
      { success: true, data: userResponse },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to update user' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/users/[id]
 * Delete a user by ID (Admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check admin authentication
    const { user, response } = await requireAdmin(request);
    if (response) return response;

    await connectDB();

    const { id } = params;

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    // Prevent admin from deleting themselves
    if (user?.id === id) {
      return NextResponse.json(
        { success: false, error: 'You cannot delete your own account' },
        { status: 400 }
      );
    }

    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'User deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to delete user' },
      { status: 500 }
    );
  }
}

