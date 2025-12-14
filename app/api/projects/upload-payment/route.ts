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

    const { projectId, receiptImage, extractedData } = await req.json();

    if (!projectId || !receiptImage) {
      return NextResponse.json(
        { error: 'Project ID and receipt image are required' },
        { status: 400 }
      );
    }

    console.log('📨 Received project payment upload:', { projectId, extractedData });

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get project and verify it belongs to the user
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { user: true }
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    if (project.userId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized: This project does not belong to you' },
        { status: 403 }
      );
    }

    if (!project.paymentRequired) {
      return NextResponse.json(
        { error: 'Payment is not required for this project' },
        { status: 400 }
      );
    }

    // Use client-extracted data if available
    const paymentAmount = extractedData?.amount || project.price;
    const transactionDate = extractedData?.date ? new Date(extractedData.date) : new Date();
    const bankRef = extractedData?.motif || project.paymentAlias || 'UNKNOWN';
    const sender = extractedData?.senderName || user.name || 'Unknown';

    console.log('💾 Saving project payment with extracted data:');
    console.log('  Project:', project.title);
    console.log('  Amount:', paymentAmount, 'MAD');
    console.log('  Date:', transactionDate.toISOString());
    console.log('  Reference:', bankRef);
    console.log('  Sender:', sender);

    // Create payment record linked to project
    const payment = await prisma.payment.create({
      data: {
        projectId: project.id,
        amount: paymentAmount,
        transactionDate: transactionDate,
        bankReference: bankRef,
        senderName: sender,
        receiptUrl: receiptImage,
        receiptData: JSON.stringify({
          ...extractedData,
          projectId: project.id,
          projectTitle: project.title,
          status: 'processed',
          uploadedAt: new Date().toISOString()
        }),
        verified: false,
        notificationSent: false
      }
    });

    // Update project payment status
    await prisma.project.update({
      where: { id: projectId },
      data: {
        paymentStatus: 'Pending',
        status: 'Awaiting Payment'
      }
    });

    console.log('✅ Project payment record created with ID:', payment.id);

    return NextResponse.json({
      success: true,
      payment: {
        id: payment.id,
        status: 'processing'
      },
      message: 'Receipt uploaded successfully! Your payment is now pending admin verification.'
    });

  } catch (error) {
    console.error('Error uploading project payment:', error);
    return NextResponse.json(
      { 
        error: 'Failed to upload receipt',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
