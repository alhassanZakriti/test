import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET - Fetch payments for verification
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Get filter from query params
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter') || 'all';

    // Build query
    const whereClause: any = {};
    
    if (filter === 'pending') {
      whereClause.verified = false;
    } else if (filter === 'verified') {
      whereClause.verified = true;
    }

    // Fetch payments
    const payments = await prisma.payment.findMany({
      where: whereClause,
      include: {
        subscription: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phoneNumber: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      payments: payments
    });

  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch payments',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST - Verify or reject payment
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
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const { paymentId, approve } = await req.json();

    if (!paymentId || typeof approve !== 'boolean') {
      return NextResponse.json(
        { error: 'Payment ID and approval status are required' },
        { status: 400 }
      );
    }

    // Get payment details
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        subscription: {
          include: {
            user: true
          }
        }
      }
    });

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    if (approve) {
      // Approve payment - update subscription
      const currentDate = new Date();
      const expirationDate = new Date(currentDate);
      expirationDate.setMonth(expirationDate.getMonth() + 1); // Add 1 month

      // Update payment as verified
      await prisma.payment.update({
        where: { id: paymentId },
        data: {
          verified: true,
          notificationSent: true
        }
      });

      // Update subscription
      await prisma.subscription.update({
        where: { id: payment.subscriptionId },
        data: {
          status: 'Paid',
          paymentDate: payment.transactionDate,
          expirationDate: expirationDate
        }
      });

      // TODO: Send confirmation email/WhatsApp to user
      console.log(`Payment approved for user: ${payment.subscription.user.email}`);

      return NextResponse.json({
        success: true,
        message: 'Payment approved successfully',
        payment: {
          id: payment.id,
          verified: true,
          expirationDate: expirationDate
        }
      });

    } else {
      // Reject payment
      await prisma.payment.update({
        where: { id: paymentId },
        data: {
          verified: false,
          notificationSent: true
        }
      });

      // TODO: Send rejection email to user with reason
      console.log(`Payment rejected for user: ${payment.subscription.user.email}`);

      return NextResponse.json({
        success: true,
        message: 'Payment rejected',
        payment: {
          id: payment.id,
          verified: false
        }
      });
    }

  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json(
      { 
        error: 'Failed to verify payment',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
