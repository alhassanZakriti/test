import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { generatePaymentAlias } from '@/lib/payment-alias';

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

    const { projectId, status, previewUrl } = await req.json();

    if (!projectId || !status) {
      return NextResponse.json(
        { error: 'Project ID and status are required' },
        { status: 400 }
      );
    }

    // Get project with user info
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        user: true
      }
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // If status is "Completed" and previewUrl is provided, require payment
    let updateData: any = {
      status: status,
      updatedAt: new Date()
    };

    if (status === 'Completed' && previewUrl) {
      // Project should already have a payment alias from creation
      let projectPaymentAlias = project.paymentAlias;
      if (!projectPaymentAlias) {
        // Fallback: generate one if missing
        console.warn('⚠️ Project missing payment alias, generating now');
        projectPaymentAlias = await generatePaymentAlias();
        updateData.paymentAlias = projectPaymentAlias;
      }

      // Set payment deadline to 3 days from now
      const paymentDeadline = new Date();
      paymentDeadline.setDate(paymentDeadline.getDate() + 3);

      updateData.previewUrl = previewUrl;
      updateData.paymentRequired = true;
      updateData.paymentStatus = 'Not Paid';
      updateData.paymentDeadline = paymentDeadline;
      
      console.log('🎨 Project completed with preview URL - Payment required');
      console.log('  Project:', project.title || project.id);
      console.log('  Preview URL:', previewUrl);
      console.log('  Payment Alias:', projectPaymentAlias);
      console.log('  Price:', project.price, 'MAD');
      console.log('  Payment Deadline:', paymentDeadline.toLocaleDateString());

      // Send email notification to user with preview
      try {
        await sendEmail({
          to: project.user.email,
          subject: `🎉 Your Project "${project.title || 'Untitled'}" is Ready!`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #7C3AED;">Your Project is Completed! 🎉</h2>
              
              <p>Hi ${project.user.name || project.user.email},</p>
              
              <p>Great news! Your project <strong>"${project.title || 'Untitled'}"</strong> has been completed and is ready for your review.</p>
              
              <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Preview Your Project:</h3>
                <a href="${previewUrl}" style="display: inline-block; background-color: #7C3AED; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0;">
                  View Preview
                </a>
              </div>
              
              <h3>Next Steps:</h3>
              <ol>
                <li>Click the preview link above to view your completed project</li>
                <li>Review the design and functionality</li>
                <li>If you're satisfied, proceed with payment (${project.price} MAD)</li>
                <li>After payment verification, the project will be delivered to you</li>
              </ol>
              
              <div style="background-color: #FEF3C7; padding: 15px; border-radius: 6px; border-left: 4px solid #F59E0B; margin: 20px 0;">
                <p style="margin: 0;"><strong>⚠️ Payment Required:</strong></p>
                <p style="margin: 5px 0 0 0;">To finalize and receive your project, please complete the payment of <strong>${project.price} MAD</strong> using your project payment reference: <strong>${projectPaymentAlias}</strong></p>
              </div>
              
              <p>If you have any questions or need revisions, please contact our support team.</p>
              
              <p>Best regards,<br/>Modual Team</p>
            </div>
          `
        });
        
        console.log('✅ Preview notification email sent to:', project.user.email);
      } catch (emailError) {
        console.error('❌ Failed to send preview email:', emailError);
      }
    } else if (previewUrl) {
      updateData.previewUrl = previewUrl;
    }

    // Update project
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: updateData
    });

    console.log('✅ Project status updated:', {
      projectId,
      status,
      previewUrl: previewUrl || 'none',
      paymentRequired: updateData.paymentRequired || false
    });

    return NextResponse.json({
      success: true,
      project: updatedProject,
      message: status === 'Completed' && previewUrl 
        ? 'Project marked as completed. User notified and payment is now required.' 
        : 'Project status updated successfully'
    });

  } catch (error) {
    console.error('Error updating project status:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update project status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
