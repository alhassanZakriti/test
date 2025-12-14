import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { paymentId, verified } = await request.json();

    if (!paymentId || typeof verified !== 'boolean') {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get payment with project and user details
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        project: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!payment || !payment.project) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    if (verified) {
      // Approve payment
      await prisma.$transaction([
        // Update payment
        prisma.payment.update({
          where: { id: paymentId },
          data: { verified: true },
        }),
        // Update project status
        prisma.project.update({
          where: { id: payment.projectId! },
          data: {
            paymentStatus: 'Paid',
            status: 'Paid',
          },
        }),
      ]);

      // Send approval email
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .info-box { background: white; padding: 15px; border-left: 4px solid #667eea; margin: 20px 0; }
            .success { color: #10b981; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Payment Approved!</h1>
            </div>
            <div class="content">
              <p>Dear ${payment.project.user.name || 'User'},</p>
              
              <p class="success">Great news! Your payment has been verified and approved.</p>
              
              <div class="info-box">
                <h3>Project Details:</h3>
                <p><strong>Project:</strong> ${payment.project.title}</p>
                <p><strong>Amount Paid:</strong> ${payment.amount} MAD</p>
                <p><strong>Transaction Date:</strong> ${new Date(payment.transactionDate).toLocaleDateString('en-GB')}</p>
                ${payment.bankReference ? `<p><strong>Reference:</strong> ${payment.bankReference}</p>` : ''}
              </div>

              ${payment.project.previewUrl ? `
              <p>Your project is now fully paid and completed. You can access it anytime:</p>
              <a href="${payment.project.previewUrl}" class="button">Access Your Project</a>
              ` : ''}

              <p>Thank you for your business! If you have any questions, feel free to contact us.</p>
              
              <p>Best regards,<br>The Modual Team</p>
            </div>
          </div>
        </body>
        </html>
      `;

      await sendEmail({
        to: payment.project.user.email,
        subject: `Payment Approved - ${payment.project.title}`,
        html: emailHtml,
      });

      return NextResponse.json({
        success: true,
        message: 'Payment approved successfully',
      });
    } else {
      // Reject payment - increment rejection count
      const currentRejectionCount = payment.project.rejectionCount || 0;
      const newRejectionCount = currentRejectionCount + 1;

      // If this is the 3rd rejection, mark as permanently rejected
      if (newRejectionCount >= 3) {
        await prisma.$transaction([
          // Delete payment
          prisma.payment.delete({
            where: { id: paymentId },
          }),
          // Mark project as rejected
          prisma.project.update({
            where: { id: payment.projectId! },
            data: {
              paymentStatus: 'Rejected',
              status: 'Rejected',
              rejectionCount: newRejectionCount,
            },
          }),
        ]);
      } else {
        // Allow retry - reset to "Not Paid" so user can upload again
        await prisma.$transaction([
          // Delete payment
          prisma.payment.delete({
            where: { id: paymentId },
          }),
          // Reset to "Not Paid" and increment rejection count
          prisma.project.update({
            where: { id: payment.projectId! },
            data: {
              paymentStatus: 'Not Paid',
              rejectionCount: newRejectionCount,
            },
          }),
        ]);
      }

      // Send rejection email
      const remainingAttempts = 3 - newRejectionCount;
      const isFinalRejection = newRejectionCount >= 3;

      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .info-box { background: white; padding: 15px; border-left: 4px solid #ef4444; margin: 20px 0; }
            .warning { color: #ef4444; font-weight: bold; }
            .attempts-box { background: #fef2f2; padding: 15px; border: 2px solid #ef4444; border-radius: 5px; margin: 20px 0; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${isFinalRejection ? '🚫 Payment Permanently Rejected' : '❌ Payment Receipt Issue'}</h1>
            </div>
            <div class="content">
              <p>Dear ${payment.project.user.name || 'User'},</p>
              
              ${isFinalRejection ? `
                <p class="warning">Your payment receipt has been rejected for the third time. Unfortunately, this project has been marked as rejected and cannot accept further payment attempts.</p>
                
                <div class="attempts-box">
                  <h3 style="color: #ef4444; margin-top: 0;">Maximum Attempts Reached</h3>
                  <p style="font-size: 18px; margin: 10px 0;"><strong>Rejection Count: 3/3</strong></p>
                  <p>Please contact our support team to resolve this issue.</p>
                </div>
              ` : `
                <p class="warning">Unfortunately, we could not verify your payment receipt.</p>
                
                <div class="attempts-box">
                  <h3 style="color: #f59e0b; margin-top: 0;">⚠️ Attempts Remaining</h3>
                  <p style="font-size: 18px; margin: 10px 0;"><strong>${remainingAttempts} ${remainingAttempts === 1 ? 'attempt' : 'attempts'} left</strong></p>
                  <p style="font-size: 14px; color: #dc2626;">After 3 rejections, the project will be permanently rejected.</p>
                </div>
              `}
              
              <div class="info-box">
                <h3>Project Details:</h3>
                <p><strong>Project:</strong> ${payment.project.title}</p>
                <p><strong>Expected Amount:</strong> ${payment.project.price} MAD</p>
                <p><strong>Payment Reference:</strong> ${payment.project.paymentAlias}</p>
              </div>

              <p><strong>Possible reasons for rejection:</strong></p>
              <ul>
                <li>Receipt image is unclear or incomplete</li>
                <li>Amount does not match the project price</li>
                <li>Transaction date is invalid or too old</li>
                <li>Payment reference (Motif) is incorrect or missing</li>
              </ul>

              ${!isFinalRejection ? `
                ${payment.project.previewUrl ? `
                <p>You can still resubmit your payment. Preview your project here:</p>
                <a href="${payment.project.previewUrl}" class="button">View Project Preview</a>
                ` : ''}

                <p><strong>To resubmit your payment:</strong></p>
                <ol>
                  <li>Make sure you use <strong>${payment.project.paymentAlias}</strong> as the payment reference (Motif)</li>
                  <li>Download a clear, complete receipt from your banking app</li>
                  <li>Go to your dashboard</li>
                  <li>Find the project: "${payment.project.title}"</li>
                  <li>Click the "Pay ${payment.project.price} MAD" button</li>
                  <li>Upload the clear photo of your payment receipt</li>
                </ol>
              ` : `
                <p>To resolve this issue, please contact our support team with your transaction details.</p>
              `}
              
              <p>Best regards,<br>The Modual Team</p>
            </div>
          </div>
        </body>
        </html>
      `;

      await sendEmail({
        to: payment.project.user.email,
        subject: `Payment Receipt Issue - ${payment.project.title}`,
        html: emailHtml,
      });

      return NextResponse.json({
        success: true,
        message: 'Payment rejected successfully',
      });
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    );
  }
}
