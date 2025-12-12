import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createWorker } from 'tesseract.js';
import prisma from '@/lib/prisma';

interface ExtractedReceiptData {
  motif: string | null;
  amount: number | null;
  date: string | null;
  senderName: string | null;
  rawText: string;
}

// Background OCR processing function
async function processReceiptOCR(paymentId: string, receiptImage: string, userEmail: string | null) {
  try {
    console.log(`Starting background OCR processing for payment ${paymentId}`);
    
    // Process image
    const base64Data = receiptImage.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Initialize Tesseract worker
    const worker = await createWorker('eng');
    
    // Perform OCR
    const { data: { text } } = await worker.recognize(buffer);
    await worker.terminate();

    // Extract receipt information
    const extractedData = extractReceiptInfo(text);

    // Update payment with extracted data
    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        amount: extractedData.amount || 0,
        transactionDate: extractedData.date ? new Date(extractedData.date) : new Date(),
        bankReference: extractedData.motif || undefined,
        senderName: extractedData.senderName || undefined,
        receiptData: JSON.stringify({
          ...extractedData,
          status: 'processed',
          processedAt: new Date().toISOString()
        })
      }
    });

    console.log(`OCR processing completed successfully for payment ${paymentId}`);
  } catch (error) {
    console.error(`OCR processing failed for payment ${paymentId}:`, error);
    
    // Update payment with error status
    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        receiptData: JSON.stringify({
          status: 'ocr_failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          failedAt: new Date().toISOString()
        })
      }
    }).catch(err => console.error('Failed to update payment error status:', err));
  }
}

function extractReceiptInfo(text: string): ExtractedReceiptData {
  const lines = text.split('\n').map(line => line.trim());
  
  let motif: string | null = null;
  let amount: number | null = null;
  let date: string | null = null;
  let senderName: string | null = null;

  // Extract MODXXXXXXXX pattern
  const modPattern = /MOD[A-Z0-9]{8}/i;
  for (const line of lines) {
    const match = line.match(modPattern);
    if (match) {
      motif = match[0].toUpperCase();
      break;
    }
  }

  // Extract amount (looking for patterns like "150 MAD", "150,00 MAD", "150.00")
  const amountPattern = /(\d{1,10})[.,]?(\d{0,2})\s*(MAD|DH|dh)?/i;
  for (const line of lines) {
    const match = line.match(amountPattern);
    if (match) {
      const amountStr = match[1] + (match[2] ? '.' + match[2] : '');
      const parsedAmount = parseFloat(amountStr);
      if (parsedAmount >= 50 && parsedAmount <= 100000) { // Reasonable range
        amount = parsedAmount;
        break;
      }
    }
  }

  // Extract date (DD/MM/YYYY or DD-MM-YYYY or YYYY-MM-DD)
  const datePattern = /(\d{2})[\/\-](\d{2})[\/\-](\d{4})|(\d{4})[\/\-](\d{2})[\/\-](\d{2})/;
  for (const line of lines) {
    const match = line.match(datePattern);
    if (match) {
      if (match[1]) {
        // DD/MM/YYYY format
        date = `${match[3]}-${match[2]}-${match[1]}`;
      } else if (match[4]) {
        // YYYY-MM-DD format
        date = `${match[4]}-${match[5]}-${match[6]}`;
      }
      break;
    }
  }

  // Extract sender name (look for "De:" or "From:" or name patterns)
  const namePatterns = [
    /(?:De|From|Nom|Name|Emetteur):\s*([A-Za-z\s]+)/i,
    /^([A-Z][a-z]+\s+[A-Z][a-z]+)$/m
  ];
  
  for (const pattern of namePatterns) {
    for (const line of lines) {
      const match = line.match(pattern);
      if (match && match[1]) {
        senderName = match[1].trim();
        break;
      }
    }
    if (senderName) break;
  }

  return {
    motif,
    amount,
    date,
    senderName,
    rawText: text
  };
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { receiptImage } = await req.json();

    if (!receiptImage) {
      return NextResponse.json(
        { error: 'Receipt image is required' },
        { status: 400 }
      );
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        currentSubscription: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user has a subscription
    let subscription = user.currentSubscription;
    
    if (!subscription) {
      // Create new subscription if none exists
      subscription = await prisma.subscription.create({
        data: {
          userId: user.id,
          uniqueCode: user.paymentAlias || 'UNKNOWN',
          status: 'Not Paid',
          plan: 'Basic',
          price: 150
        }
      });

      // Link to user
      await prisma.user.update({
        where: { id: user.id },
        data: { currentSubscriptionId: subscription.id }
      });
    }

    // Create payment record immediately (OCR will process in background)
    const payment = await prisma.payment.create({
      data: {
        subscriptionId: subscription.id,
        amount: 0, // Will be updated after OCR processing
        transactionDate: new Date(),
        bankReference: user.paymentAlias,
        senderName: user.name || 'Unknown',
        receiptUrl: receiptImage,
        receiptData: JSON.stringify({
          status: 'processing',
          uploadedAt: new Date().toISOString()
        }),
        verified: false,
        notificationSent: false
      }
    });

    // Update subscription status to pending verification
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { 
        status: 'Pending Verification'
      }
    });

    // Return immediately to user
    const response = NextResponse.json({
      success: true,
      payment: {
        id: payment.id,
        status: 'processing'
      },
      message: 'Receipt uploaded successfully! We are processing your receipt in the background. You will receive an email notification once it has been verified by our admin team.'
    });

    // Process OCR asynchronously (don't await - let it run in background)
    processReceiptOCR(payment.id, receiptImage, user.email).catch(error => {
      console.error('Background OCR processing failed:', error);
    });

    return response;

  } catch (error) {
    console.error('Error processing receipt:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process receipt',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
