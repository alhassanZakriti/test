import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const admin = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (admin?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const { projectId, websiteType } = await req.json();

    if (!projectId || !websiteType) {
      return NextResponse.json(
        { error: 'Project ID and website type are required' },
        { status: 400 }
      );
    }

    // Validate website type
    if (websiteType !== 'basic' && websiteType !== 'ecommerce') {
      return NextResponse.json(
        { error: 'Invalid website type. Must be "basic" or "ecommerce"' },
        { status: 400 }
      );
    }

    // Calculate new price based on website type
    const price = websiteType === 'ecommerce' ? 250 : 150;

    // Update project website type and price
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        websiteType,
        price,
        updatedAt: new Date()
      }
    });

    console.log('✅ Website type updated:', {
      projectId,
      websiteType,
      price,
      title: updatedProject.title
    });

    return NextResponse.json({
      success: true,
      project: updatedProject,
      message: `Website type updated to ${websiteType === 'ecommerce' ? 'E-commerce' : 'Basic Website'} (${price} MAD)`
    });

  } catch (error) {
    console.error('Error updating website type:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update website type',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
