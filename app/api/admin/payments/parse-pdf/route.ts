import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pdfParse from 'pdf-parse';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { pdfBase64 } = body;

    if (!pdfBase64) {
      return NextResponse.json({ error: 'No PDF data provided' }, { status: 400 });
    }

    // Convert base64 to buffer
    const pdfBuffer = Buffer.from(pdfBase64, 'base64');

    // Parse PDF using the default function
    const pdf = (pdfParse as any).default || pdfParse;
    const data = await pdf(pdfBuffer);
    const text = data.text;

    // Extract payment information from PDF text
    const paymentData = extractPaymentData(text);

    return NextResponse.json({
      success: true,
      data: paymentData,
      totalTransactions: paymentData.length,
    });
  } catch (error) {
    console.error('Error parsing PDF:', error);
    return NextResponse.json(
      { error: 'Failed to parse PDF file', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

function extractPaymentData(text: string) {
  const payments: Array<{
    date: string;
    amount: string;
    description: string;
    senderName: string;
  }> = [];

  // Split text into lines
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

  // Look for patterns that indicate transactions
  // This regex looks for MODXXXXXXXX codes in the text
  const codePattern = /MOD\d{8}/gi;
  
  // Common date patterns: DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD
  const datePattern = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}|\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/g;
  
  // Amount patterns: numbers with optional currency symbols and decimal points
  const amountPattern = /(\d{1,3}(?:[,\s]\d{3})*(?:[.,]\d{2})?)\s*(?:MAD|DH|Dhs)?/gi;

  // Strategy 1: Line-by-line extraction
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Look for MODXXXXXXXX code in the current line
    const codeMatch = line.match(codePattern);
    if (codeMatch) {
      const code = codeMatch[0].toUpperCase();
      
      // Look for date in current or nearby lines (±3 lines)
      let date = '';
      let amount = '';
      let senderName = '';
      
      // Search in a window around the code
      const searchWindow = 5;
      const startIdx = Math.max(0, i - searchWindow);
      const endIdx = Math.min(lines.length, i + searchWindow + 1);
      
      // Extract date
      for (let j = startIdx; j < endIdx; j++) {
        const dateMatch = lines[j].match(datePattern);
        if (dateMatch) {
          date = normalizeDate(dateMatch[0]);
          break;
        }
      }
      
      // Extract amount
      for (let j = startIdx; j < endIdx; j++) {
        const amountMatch = lines[j].match(amountPattern);
        if (amountMatch) {
          // Clean and normalize amount
          const rawAmount = amountMatch[0].replace(/[^\d.,]/g, '').replace(',', '.');
          const parsedAmount = parseFloat(rawAmount);
          if (!isNaN(parsedAmount) && parsedAmount >= 100) {
            amount = parsedAmount.toString();
            break;
          }
        }
      }
      
      // Try to extract sender name (look for lines with text before/after the code)
      const contextLines = lines.slice(Math.max(0, i - 2), Math.min(lines.length, i + 3));
      for (const contextLine of contextLines) {
        // Remove code from line and clean up
        const cleanLine = contextLine.replace(codePattern, '').replace(/[^\w\s]/g, ' ').trim();
        if (cleanLine.length > 3 && cleanLine.length < 100 && !cleanLine.match(/^\d+$/)) {
          // This might be a name
          senderName = cleanLine;
          break;
        }
      }
      
      // If we found at least a code and amount, add it
      if (code && amount) {
        payments.push({
          date: date || new Date().toISOString().split('T')[0],
          amount: amount,
          description: `Payment ${code}`,
          senderName: senderName || 'Unknown',
        });
      }
    }
  }

  // Strategy 2: Table-like structure detection
  // Some PDFs have structured data in table format
  if (payments.length === 0) {
    // Look for structured table data
    const tablePattern = /(\d{2}\/\d{2}\/\d{4}).*?([\d,\.]+).*?(MOD\d{8})/gi;
    let match;
    
    while ((match = tablePattern.exec(text)) !== null) {
      const [, date, amount, code] = match;
      const cleanAmount = amount.replace(/[^\d.]/g, '');
      
      if (parseFloat(cleanAmount) >= 100) {
        payments.push({
          date: normalizeDate(date),
          amount: cleanAmount,
          description: `Payment ${code.toUpperCase()}`,
          senderName: 'From PDF',
        });
      }
    }
  }

  // Remove duplicates based on code
  const uniquePayments = payments.filter((payment, index, self) =>
    index === self.findIndex(p => p.description === payment.description)
  );

  return uniquePayments;
}

function normalizeDate(dateStr: string): string {
  // Try to parse various date formats and convert to YYYY-MM-DD
  try {
    // Replace various separators with /
    let normalized = dateStr.replace(/[-\.]/g, '/');
    
    // Check if it's DD/MM/YYYY or MM/DD/YYYY
    const parts = normalized.split('/');
    
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        // YYYY/MM/DD format
        return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
      } else {
        // DD/MM/YYYY or MM/DD/YYYY - assume DD/MM/YYYY (European format)
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        const year = parts[2];
        return `${year}-${month}-${day}`;
      }
    }
  } catch (error) {
    console.error('Error normalizing date:', error);
  }
  
  // Fallback to today's date
  return new Date().toISOString().split('T')[0];
}
