import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🔵 Firebase auth request:', { uid: body.uid, email: body.email, displayName: body.displayName });
    
    const { uid, email, displayName, photoURL } = body;

    if (!uid || !email) {
      console.error('❌ Missing required fields:', { uid: !!uid, email: !!email });
      return NextResponse.json(
        { error: 'UID and email are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { email },
    });

    // Hash the Firebase UID to use as password
    const hashedPassword = await bcrypt.hash(uid, 10);

    if (!user) {
      // Create new user from Firebase data
      console.log('🟡 Creating new user from Firebase data...');
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
      // Always update password to match current Firebase UID for Google users
      console.log('🟡 Updating existing user password to Firebase UID...');
      user = await prisma.user.update({
        where: { email },
        data: { 
          password: hashedPassword,
          image: photoURL || user.image,
          emailVerified: new Date(),
        },
      });
      console.log('✅ Existing user password updated for Google sign-in:', user.email);
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
  } catch (error: any) {
    console.error('❌ Firebase auth error:', error);
    console.error('Error details:', error.message);
    return NextResponse.json(
      { error: 'Authentication failed', details: error.message },
      { status: 500 }
    );
  }
}
