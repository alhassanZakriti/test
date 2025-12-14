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
    
    // Get payment details with user info
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
      console.error(`Payment ${paymentId} not found`);
      return;
    }

    const expectedPaymentAlias = payment.subscription.uniqueCode;
    const expectedAmount = payment.subscription.price || 150;
    
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

    // Validate extracted data
    const isMotifMatch = extractedData.motif === expectedPaymentAlias;
    const isAmountMatch = extractedData.amount && Math.abs(extractedData.amount - expectedAmount) <= 10;
    const confidenceScore = (isMotifMatch ? 50 : 0) + (isAmountMatch ? 40 : 0) + (extractedData.date ? 10 : 0);

    // Update payment with extracted data
    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        amount: extractedData.amount || 0,
        transactionDate: extractedData.date ? new Date(extractedData.date) : new Date(),
        bankReference: extractedData.motif || expectedPaymentAlias,
        senderName: extractedData.senderName || payment.subscription.user.name || undefined,
        receiptData: JSON.stringify({
          ...extractedData,
          status: 'processed',
          processedAt: new Date().toISOString(),
          validation: {
            expectedMotif: expectedPaymentAlias,
            expectedAmount: expectedAmount,
            motifMatch: isMotifMatch,
            amountMatch: isAmountMatch,
            confidenceScore: confidenceScore
          }
        })
      }
    });

    console.log(`OCR processing completed for payment ${paymentId} - Confidence: ${confidenceScore}%`);
    console.log(`Motif Match: ${isMotifMatch}, Amount Match: ${isAmountMatch}`);
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
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const fullText = text.toUpperCase();
  
  let motif: string | null = null;
  let amount: number | null = null;
  let date: string | null = null;
  let senderName: string | null = null;

  // Enhanced MODXXXXXXXX pattern extraction - check multiple variations
  const modPatterns = [
    /MOD[A-Z0-9]{8}/gi,
    /MOTIF[:\s]*MOD[A-Z0-9]{8}/gi,
    /REFERENCE[:\s]*MOD[A-Z0-9]{8}/gi,
    /REF[:\s]*MOD[A-Z0-9]{8}/gi
  ];
  
  for (const pattern of modPatterns) {
    const matches = text.match(pattern);
    if (matches) {
      // Extract just the MODXXXXXXXX part
      const modMatch = matches[0].match(/MOD[A-Z0-9]{8}/i);
      if (modMatch) {
        motif = modMatch[0].toUpperCase();
        break;
      }
    }
  }

  // Enhanced amount extraction with multiple patterns
  const amountPatterns = [
    /MONTANT[:\s]*(\d{1,6})[.,]?(\d{0,2})\s*(MAD|DH)/gi,
    /AMOUNT[:\s]*(\d{1,6})[.,]?(\d{0,2})\s*(MAD|DH)/gi,
    /(\d{1,6})[.,](\d{2})\s*(MAD|DH)/gi,
    /(\d{1,6})\s*(MAD|DH)/gi
  ];
  
  for (const pattern of amountPatterns) {
    for (const line of lines) {
      const match = line.match(pattern);
      if (match) {
        const amountStr = match[1] + (match[2] && match[2] !== '' ? '.' + match[2] : '.00');
        const parsedAmount = parseFloat(amountStr);
        if (parsedAmount >= 50 && parsedAmount <= 10000) {
          amount = parsedAmount;
          break;
        }
      }
    }
    if (amount) break;
  }

  // Enhanced date extraction with multiple formats
  const datePatterns = [
    /DATE[:\s]*(\d{2})[\/\-](\d{2})[\/\-](\d{4})/i,
    /(\d{2})[\/\-](\d{2})[\/\-](\d{4})/,
    /(\d{4})[\/\-](\d{2})[\/\-](\d{2})/
  ];
  
  for (const pattern of datePatterns) {
    for (const line of lines) {
      const match = line.match(pattern);
      if (match) {
        if (match[1] && parseInt(match[1]) <= 31) {
          // DD/MM/YYYY format
          date = `${match[3]}-${match[2]}-${match[1]}`;
        } else if (match[1] && parseInt(match[1]) > 31) {
          // YYYY-MM-DD format
          date = `${match[1]}-${match[2]}-${match[3]}`;
        }
        break;
      }
    }
    if (date) break;
  }

  // Enhanced sender name extraction
  const namePatterns = [
    /(?:DE|FROM|NOM|NAME|EMETTEUR|EXPEDITEUR)[:\s]+([A-Z][A-Za-z\s]{2,40})/i,
    /^([A-Z][a-z]+\s+[A-Z][a-z]+)$/m
  ];
  
  for (const pattern of namePatterns) {
    for (const line of lines) {
      const match = line.match(pattern);
      if (match && match[1] && match[1].length >= 3) {
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

    const { receiptImage, extractedData } = await req.json();

    if (!receiptImage) {
      return NextResponse.json(
        { error: 'Receipt image is required' },
        { status: 400 }
      );
    }

    console.log('📨 Received extracted data from client:', extractedData);

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

    // Use client-extracted data if available, otherwise defaults
    const paymentAmount = extractedData?.amount || 0;
    const transactionDate = extractedData?.date ? new Date(extractedData.date) : new Date();
    const bankRef = extractedData?.motif || user.paymentAlias || 'UNKNOWN';
    const sender = extractedData?.senderName || user.name || 'Unknown';

    console.log('💾 Saving payment with extracted data:');
    console.log('  Amount:', paymentAmount, 'MAD');
    console.log('  Date:', transactionDate.toISOString());
    console.log('  Reference:', bankRef);
    console.log('  Sender:', sender);

    // Create payment record with client-extracted data
    const payment = await prisma.payment.create({
      data: {
        subscriptionId: subscription.id,
        amount: paymentAmount,
        transactionDate: transactionDate,
        bankReference: bankRef,
        senderName: sender,
        receiptUrl: receiptImage,
        receiptData: JSON.stringify({
          ...extractedData,
          status: 'processed',
          uploadedAt: new Date().toISOString()
        }),
        verified: false,
        notificationSent: false
      }
    });

    console.log('✅ Payment record created with ID:', payment.id);

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
