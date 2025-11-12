import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

/**
 * POST /api/admin/seed
 * Seed admin user (admin@gmail.com / admin123)
 * This is a one-time setup route
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const adminEmail = 'admin@gmail.com';
    const adminPassword = 'admin123';

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: 'Admin user already exists',
          data: {
            email: existingAdmin.email,
            role: existingAdmin.role,
          },
        },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // Create admin user
    const admin = await User.create({
      name: 'Admin',
      email: adminEmail,
      password: hashedPassword,
      role: 'admin',
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Admin user created successfully',
        data: {
          email: admin.email,
          role: admin.role,
          password: adminPassword, // Only returned on creation
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to seed admin user' },
      { status: 500 }
    );
  }
}

