import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendPaymentConfirmationWhatsApp } from '@/lib/whatsapp';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { csvData } = body; // Array of { date, amount, description, senderName }

    if (!Array.isArray(csvData) || csvData.length === 0) {
      return NextResponse.json({ error: 'Invalid CSV data' }, { status: 400 });
    }

    const results = {
      matched: 0,
      unmatched: 0,
      errors: 0,
      details: [] as any[],
    };

    // Get all subscriptions with Not Paid status
    const subscriptions = await prisma.subscription.findMany({
      where: {
        status: 'Not Paid',
      },
      include: {
        user: {
          include: {
            projects: {
              select: {
                phoneNumber: true,
              },
              take: 1,
            },
          },
        },
      },
    });

    // Process each CSV row
    for (const row of csvData) {
      try {
        const { date, amount, description, senderName } = row;

        // Parse amount
        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount < 100) {
          results.unmatched++;
          continue;
        }

        // Extract code from description (look for MOD-XXXX pattern)
        const codeMatch = description?.match(/MOD-\d{4}/i);
        if (!codeMatch) {
          results.unmatched++;
          results.details.push({
            row,
            status: 'No code found',
          });
          continue;
        }

        const code = codeMatch[0].toUpperCase();

        // Find matching subscription
        const subscription = subscriptions.find(
          (sub) => sub.uniqueCode === code
        );

        if (!subscription) {
          results.unmatched++;
          results.details.push({
            row,
            code,
            status: 'Code not found',
          });
          continue;
        }

        // Check if payment already exists
        const existingPayment = await prisma.payment.findFirst({
          where: {
            subscriptionId: subscription.id,
            bankReference: description,
          },
        });

        if (existingPayment) {
          results.details.push({
            row,
            code,
            status: 'Already processed',
          });
          continue;
        }

        // Create payment record
        const transactionDate = new Date(date);
        const expirationDate = new Date(transactionDate);
        expirationDate.setDate(expirationDate.getDate() + 30);

        await prisma.payment.create({
          data: {
            subscriptionId: subscription.id,
            amount: parsedAmount,
            transactionDate,
            bankReference: description,
            description,
            senderName,
            verified: true,
            notificationSent: false,
          },
        });

        // Update subscription status
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            status: 'Paid',
            paymentDate: transactionDate,
            expirationDate,
          },
        });

        results.matched++;

        // Send notifications (email + WhatsApp)
        try {
          // Send email (using existing email service)
          const { sendProjectStatusUpdateEmail } = await import('@/lib/email');
          await sendProjectStatusUpdateEmail({
            clientName: subscription.user.name || 'Client',
            clientEmail: subscription.user.email,
            projectTitle: `Subscription ${subscription.uniqueCode}`,
            oldStatus: 'Not Paid',
            newStatus: 'Paid',
            projectId: subscription.id,
          });

          // Send WhatsApp if phone number available
          const phoneNumber = subscription.user.projects[0]?.phoneNumber;
          if (phoneNumber) {
            await sendPaymentConfirmationWhatsApp({
              name: subscription.user.name || 'Client',
              phone: phoneNumber,
              code: subscription.uniqueCode,
              expirationDate,
              amount: parsedAmount,
            });
          }

          // Mark notification as sent
          await prisma.payment.updateMany({
            where: {
              subscriptionId: subscription.id,
              notificationSent: false,
            },
            data: {
              notificationSent: true,
            },
          });
        } catch (notifError) {
          console.error('Error sending notifications:', notifError);
        }

        results.details.push({
          row,
          code,
          userName: subscription.user.name,
          userEmail: subscription.user.email,
          status: 'Success',
        });
      } catch (error) {
        console.error('Error processing row:', error);
        results.errors++;
        results.details.push({
          row,
          status: 'Error',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Error processing payments:', error);
    return NextResponse.json(
      { error: 'Failed to process payments' },
      { status: 500 }
    );
  }
}
