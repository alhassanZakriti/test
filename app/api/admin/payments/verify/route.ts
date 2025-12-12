import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { sendEmail } from '@/lib/email';

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

      // Send confirmation email to user
      const userName = payment.subscription.user.name || 'User';
      const userEmail = payment.subscription.user.email;
      
      try {
        await sendEmail({
          to: userEmail,
          subject: '✅ Payment Approved - Subscription Activated',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #10b981;">Payment Approved!</h2>
              <p>Dear ${userName},</p>
              <p>Great news! Your payment has been verified and approved by our team.</p>
              
              <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #059669;">Subscription Details:</h3>
                <p style="margin: 5px 0;"><strong>Amount:</strong> ${payment.amount} MAD</p>
                <p style="margin: 5px 0;"><strong>Payment Reference:</strong> ${payment.bankReference}</p>
                <p style="margin: 5px 0;"><strong>Valid Until:</strong> ${expirationDate.toLocaleDateString()}</p>
              </div>
              
              <p>Your subscription is now active and you have full access to all features.</p>
              <p>Thank you for using our service!</p>
              
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 12px;">
                If you have any questions, please contact our support team.
              </p>
            </div>
          `
        });
        console.log(`Approval email sent to: ${userEmail}`);
      } catch (emailError) {
        console.error('Failed to send approval email:', emailError);
        // Continue even if email fails
      }

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

      // Send rejection email to user
      const userName = payment.subscription.user.name || 'User';
      const userEmail = payment.subscription.user.email;
      
      try {
        await sendEmail({
          to: userEmail,
          subject: '⚠️ Payment Verification Required - Additional Information Needed',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #f59e0b;">Payment Verification Issue</h2>
              <p>Dear ${userName},</p>
              <p>We've reviewed your payment receipt, but we need some additional information or clarification.</p>
              
              <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #d97706;">Payment Details:</h3>
                <p style="margin: 5px 0;"><strong>Payment Reference:</strong> ${payment.bankReference || 'N/A'}</p>
                <p style="margin: 5px 0;"><strong>Submitted Date:</strong> ${payment.createdAt.toLocaleDateString()}</p>
              </div>
              
              <p><strong>Common Issues:</strong></p>
              <ul>
                <li>Receipt image is unclear or unreadable</li>
                <li>Payment reference (Motif) doesn't match your account</li>
                <li>Amount doesn't match subscription price</li>
                <li>Receipt appears to be from a different transaction</li>
              </ul>
              
              <p>Please log into your account and upload a new, clear receipt with the correct payment reference: <strong>${payment.subscription.uniqueCode}</strong></p>
              
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 12px;">
                If you believe this is an error or need assistance, please contact our support team.
              </p>
            </div>
          `
        });
        console.log(`Rejection email sent to: ${userEmail}`);
      } catch (emailError) {
        console.error('Failed to send rejection email:', emailError);
        // Continue even if email fails
      }

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
