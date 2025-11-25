import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { uid, email, displayName, photoURL } = await request.json();

    if (!uid || !email) {
      return NextResponse.json(
        { error: 'UID and email are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Create new user from Firebase data
      const hashedPassword = await bcrypt.hash(uid, 10);
      user = await prisma.user.create({
        data: {
          email,
          name: displayName || email.split('@')[0],
          password: hashedPassword, // Hash Firebase UID as password
          image: photoURL || null,
          role: 'user',
          emailVerified: new Date(),
        },
      });

      console.log('✅ New user created from Google sign-in:', user.email);
    } else {
      console.log('✅ Existing user signed in with Google:', user.email);
    }

    return NextResponse.json({ 
      success: true, 
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      }
    });
  } catch (error) {
    console.error('❌ Firebase auth error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
