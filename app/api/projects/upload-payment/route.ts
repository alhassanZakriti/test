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

    console.log('💾 Validating and saving project payment with extracted data:');
    console.log('  Project:', project.title);
    console.log('  Amount:', paymentAmount, 'MAD');
    console.log('  Expected Amount:', project.price, 'MAD');
    console.log('  Date:', transactionDate.toISOString());
    console.log('  Reference:', bankRef);
    console.log('  Expected Reference:', project.paymentAlias);
    console.log('  Sender:', sender);

    // Validation: Verify project status is PREVIEW
    if (project.status !== 'PREVIEW') {
      return NextResponse.json(
        { error: 'Project must be in PREVIEW status to submit payment. Current status: ' + project.status },
        { status: 400 }
      );
    }

    // Validation: Verify bank reference matches payment alias
    if (bankRef !== project.paymentAlias) {
      console.log('❌ Payment reference mismatch!');
      console.log('   Expected:', project.paymentAlias);
      console.log('   Received:', bankRef);
      return NextResponse.json(
        { error: `Payment reference does not match project ID. Expected: ${project.paymentAlias}, Received: ${bankRef}` },
        { status: 400 }
      );
    }

    // Validation: Verify amount matches (allow small variance for fees)
    const amountDifference = Math.abs(paymentAmount - project.price);
    if (amountDifference > 5) {
      console.log('❌ Payment amount mismatch!');
      console.log('   Expected:', project.price, 'MAD');
      console.log('   Received:', paymentAmount, 'MAD');
      console.log('   Difference:', amountDifference, 'MAD');
      return NextResponse.json(
        { error: `Payment amount does not match. Expected: ${project.price} MAD, Received: ${paymentAmount} MAD` },
        { status: 400 }
      );
    }

    // Validation: Verify date is recent (within 30 days)
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    if (transactionDate > now) {
      return NextResponse.json(
        { error: 'Transaction date cannot be in the future' },
        { status: 400 }
      );
    }
    
    if (transactionDate < thirtyDaysAgo) {
      return NextResponse.json(
        { error: 'Transaction date must be within the last 30 days' },
        { status: 400 }
      );
    }

    console.log('✅ All validations passed! Creating payment record and completing project...');

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
          status: 'verified',
          uploadedAt: new Date().toISOString()
        }),
        verified: false, // Admin will manually verify
        notificationSent: false
      }
    });

    // Update project: Set payment status to Pending (waiting for admin verification)
    await prisma.project.update({
      where: { id: projectId },
      data: {
        paymentStatus: 'Pending',
        updatedAt: new Date()
      }
    });

    console.log('✅ Project payment record created with ID:', payment.id);
    console.log('✅ Payment status updated: Required → Pending (waiting for admin verification)');

    // TODO: Send notification to client about successful completion
    // TODO: Notify admin about new payment for verification

    return NextResponse.json({
      success: true,
      payment: {
        id: payment.id,
        status: 'pending'
      },
      project: {
        status: 'PREVIEW',
        paymentStatus: 'Pending'
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
