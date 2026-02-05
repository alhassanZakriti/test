import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { sendProjectStatusUpdateEmail } from '@/lib/email';
import { sendWhatsAppMessage } from '@/lib/whatsapp';

/**
 * POST /api/projects/[id]/verify-payment
 * Verify receipt and update project status from PREVIEW to COMPLETE
 * This is called when user uploads a valid receipt with matching payment information
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Not authorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      receiptUrl, 
      bankReference, 
      amount, 
      transactionDate, 
      senderName,
      receiptData 
    } = body;

    const userId = (session.user as any).id;

    // Get the project
    const project = await prisma.project.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            preferredLanguage: true,
            phoneNumber: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Verify user owns this project
    if (project.userId !== userId) {
      return NextResponse.json(
        { error: 'Not authorized to update this project' },
        { status: 403 }
      );
    }

    // Verify project is in PREVIEW status
    if (project.status !== 'PREVIEW') {
      return NextResponse.json(
        { error: 'Project must be in PREVIEW status to submit payment' },
        { status: 400 }
      );
    }

    // Verify the bank reference matches the project payment alias
    if (bankReference !== project.paymentAlias) {
      return NextResponse.json(
        { error: 'Payment reference does not match project ID. Expected: ' + project.paymentAlias },
        { status: 400 }
      );
    }

    // Verify amount matches project price (allow small variance for fees)
    const expectedAmount = project.price;
    if (Math.abs(amount - expectedAmount) > 5) { // Allow 5 MAD variance
      return NextResponse.json(
        { error: `Payment amount does not match. Expected: ${expectedAmount} MAD, Received: ${amount} MAD` },
        { status: 400 }
      );
    }

    const oldStatus = project.status;

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        projectId: project.id,
        amount: amount,
        transactionDate: new Date(transactionDate),
        bankReference: bankReference,
        senderName: senderName,
        receiptUrl: receiptUrl,
        receiptData: receiptData ? JSON.stringify(receiptData) : null,
        verified: false, // Admin needs to manually verify
        notificationSent: false,
      },
    });

    // Update project status to COMPLETE and payment status to Paid
    const updatedProject = await prisma.project.update({
      where: { id: params.id },
      data: {
        status: 'COMPLETE',
        paymentStatus: 'Paid',
        paymentRequired: true,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            preferredLanguage: true,
            phoneNumber: true,
          },
        },
      },
    });

    // Send notification to user about successful payment submission
    if (project.user) {
      const userLang = project.user.preferredLanguage || 'en';
      
      const translations: Record<string, any> = {
        en: {
          greeting: 'Hello',
          paymentReceived: 'Payment receipt received!',
          project: 'Project',
          status: 'Status',
          message: 'Your payment receipt has been received and your project is now complete. An admin will verify your payment shortly.',
          viewDetails: 'View details'
        },
        nl: {
          greeting: 'Hallo',
          paymentReceived: 'Betalingsbewijs ontvangen!',
          project: 'Project',
          status: 'Status',
          message: 'Uw betalingsbewijs is ontvangen en uw project is nu voltooid. Een beheerder zal uw betaling binnenkort verifiëren.',
          viewDetails: 'Bekijk details'
        },
        fr: {
          greeting: 'Bonjour',
          paymentReceived: 'Reçu de paiement reçu!',
          project: 'Projet',
          status: 'Statut',
          message: 'Votre reçu de paiement a été reçu et votre projet est maintenant terminé. Un administrateur vérifiera votre paiement sous peu.',
          viewDetails: 'Voir les détails'
        },
        ar: {
          greeting: 'مرحبا',
          paymentReceived: 'تم استلام إيصال الدفع!',
          project: 'المشروع',
          status: 'الحالة',
          message: 'تم استلام إيصال الدفع الخاص بك وأصبح مشروعك مكتملاً الآن. سيقوم المسؤول بالتحقق من دفعتك قريباً.',
          viewDetails: 'عرض التفاصيل'
        }
      };

      const t = translations[userLang] || translations.en;

      // Send Email
      try {
        await sendProjectStatusUpdateEmail({
          clientName: project.user.name || t.greeting,
          clientEmail: project.user.email,
          projectTitle: project.title || 'Project',
          oldStatus: oldStatus,
          newStatus: 'COMPLETE',
          projectId: params.id,
          preferredLanguage: userLang,
        });
      } catch (emailError) {
        console.error('⚠️ Failed to send email notification:', emailError);
      }

      // Send WhatsApp
      try {
        if (project.phoneNumber) {
          await sendWhatsAppMessage({
            to: project.phoneNumber,
            message: `
✅ *Modual - ${t.paymentReceived}*

${t.greeting} ${project.user.name || t.greeting},

${t.message}

📋 *${t.project}:* ${project.title || 'Project'}
🔄 *${t.status}:* ${oldStatus} → COMPLETE
💰 *Amount:* ${amount} MAD

${t.viewDetails}: modual.ma/dashboard

_Modual.ma_
            `.trim(),
          });
        }
      } catch (whatsappError) {
        console.error('⚠️ Failed to send WhatsApp notification:', whatsappError);
      }
    }

    return NextResponse.json({
      success: true,
      project: updatedProject,
      payment: payment,
      message: 'Payment receipt submitted successfully. Project is now complete!',
    });

  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json(
      { error: 'Something went wrong while processing payment' },
      { status: 500 }
    );
  }
}
