import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        currentSubscription: {
          include: {
            payments: {
              orderBy: { transactionDate: 'desc' },
              take: 1
            }
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Admins don't need subscriptions - return full access
    if (user.role === 'admin') {
      return NextResponse.json({
        needsPayment: false,
        status: 'Admin',
        daysRemaining: 999999,
        expirationDate: null,
        paymentAlias: null,
        message: 'Admin accounts have unlimited access'
      });
    }

    const subscription = user.currentSubscription;

    // If no subscription, user needs to pay
    if (!subscription) {
      return NextResponse.json({
        needsPayment: true,
        status: 'No Subscription',
        daysRemaining: 0,
        expirationDate: null,
        lastPayment: null,
        paymentAlias: user.paymentAlias
      });
    }

    const now = new Date();
    const expirationDate = subscription.expirationDate;
    const lastPayment = subscription.payments[0] || null;

    // Check if subscription is expired
    if (expirationDate && expirationDate < now) {
      return NextResponse.json({
        needsPayment: true,
        status: 'Expired',
        daysRemaining: 0,
        expirationDate: expirationDate,
        lastPayment: lastPayment ? {
          amount: lastPayment.amount,
          date: lastPayment.transactionDate,
          verified: lastPayment.verified
        } : null,
        paymentAlias: user.paymentAlias || subscription.uniqueCode
      });
    }

    // Check if payment is pending verification
    if (lastPayment && !lastPayment.verified) {
      return NextResponse.json({
        needsPayment: false,
        status: 'Pending Verification',
        message: 'Your payment is pending admin verification',
        daysRemaining: expirationDate 
          ? Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          : 0,
        expirationDate: expirationDate,
        lastPayment: {
          amount: lastPayment.amount,
          date: lastPayment.transactionDate,
          verified: lastPayment.verified,
          bankReference: lastPayment.bankReference
        },
        paymentAlias: user.paymentAlias || subscription.uniqueCode
      });
    }

    // Calculate days remaining
    const daysRemaining = expirationDate 
      ? Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    // Check if payment is due soon (less than 7 days)
    const needsPayment = subscription.status !== 'Paid' || daysRemaining < 7;

    return NextResponse.json({
      needsPayment: needsPayment,
      status: subscription.status,
      daysRemaining: daysRemaining,
      expirationDate: expirationDate,
      plan: subscription.plan,
      price: subscription.price,
      lastPayment: lastPayment ? {
        amount: lastPayment.amount,
        date: lastPayment.transactionDate,
        verified: lastPayment.verified,
        bankReference: lastPayment.bankReference
      } : null,
      paymentAlias: user.paymentAlias || subscription.uniqueCode
    });

  } catch (error) {
    console.error('Error checking subscription status:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check subscription status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
