'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, Check, XCircle, CheckCircle, ExternalLink } from 'lucide-react';
import { createWorker } from 'tesseract.js';
import toast from 'react-hot-toast';

interface ProjectPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  isBlocking?: boolean; // Modal cannot be closed if true (for PREVIEW status)
  project: {
    id: string;
    title: string;
    description?: string;
    textInput?: string;
    logoUrl?: string;
    photoUrls?: string;
    voiceMemoUrl?: string;
    price: number;
    previewUrl?: string;
    paymentStatus: string;
    rejectionCount?: number;
    createdAt?: string;
  };
  paymentAlias: string;
  onPaymentSubmitted: () => void;
}

export default function ProjectPaymentModal({
  isOpen,
  onClose,
  isBlocking = false,
  project,
  paymentAlias,
  onPaymentSubmitted
}: ProjectPaymentModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [uploadProgress, setUploadProgress] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setSelectedFile(null);
      setPreviewUrl(null);
      setUploading(false);
      setProcessing(false);
      setError(null);
      setSuccess(false);
      setExtractedData(null);
      setValidationResult(null);
      setUploadProgress('');
    }
  }, [isOpen]);

  // Prevent ESC key from closing modal when blocking
  useEffect(() => {
    if (isOpen && isBlocking) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          toast.error('⚠️ You must upload a payment receipt before continuing', {
            duration: 4000,
          });
        }
      };

      document.addEventListener('keydown', handleKeyDown, true);
      return () => {
        document.removeEventListener('keydown', handleKeyDown, true);
      };
    }
  }, [isOpen, isBlocking]);

  const compressImage = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    setError(null);
    setSelectedFile(file);
    
    try {
      const compressedImage = await compressImage(file);
      setPreviewUrl(compressedImage);
      
      // Start OCR processing immediately
      await processReceiptOCR(compressedImage);
    } catch (err) {
      setError('Failed to process image');
      console.error('Image compression error:', err);
    }
  };

  const extractReceiptInfo = (text: string) => {
    console.log('🔍 RAW OCR TEXT:', text);
    console.log('=====================================');
    
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    let motif: string | null = null;
    let amount: number | null = null;
    let date: string | null = null;
    let senderName: string | null = null;

    // Extract MODXXXXXXXX pattern (French: next to "MOTIF")
    const modPatterns = [
      /MOTIF[:\s]*[:]?\s*(MOD[A-Z0-9]{8})/gi,
      /MOTIF[:\s]+([A-Z0-9]{11})/gi,
      /MOD[A-Z0-9]{8}/gi,
    ];
    
    for (const pattern of modPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        console.log('✓ Motif pattern matched:', matches);
        const modMatch = matches[0].match(/MOD[A-Z0-9]{8}/i);
        if (modMatch) {
          motif = modMatch[0].toUpperCase();
          console.log('✓ Extracted MOTIF:', motif);
          break;
        }
      }
    }

    if (!motif) {
      console.log('✗ No MOTIF found');
    }

    // Extract amount (French: next to "MONTANT" and before "Dirhams")
    const amountPatterns = [
      /MONTANT[:\s]*[:]?\s*(\d{1,6})[.,]?(\d{0,2})\s*(?:DIRHAMS?|MAD|DH)/gi,
      /MONTANT[:\s]*[:]?\s*(\d{1,6})[.,]?(\d{0,2})/gi,
      /(\d{1,6})[.,](\d{2})\s*(?:DIRHAMS?|MAD|DH)/gi,
      /(\d{1,6})\s*(?:DIRHAMS?|MAD|DH)/gi
    ];
    
    for (const pattern of amountPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        console.log('✓ Amount pattern matched:', matches);
        for (const match of matches) {
          const numberMatch = match.match(/(\d{1,6})[.,]?(\d{0,2})/);
          if (numberMatch) {
            const amountStr = numberMatch[1] + (numberMatch[2] && numberMatch[2] !== '' ? '.' + numberMatch[2] : '.00');
            const parsedAmount = parseFloat(amountStr);
            if (parsedAmount >= 50 && parsedAmount <= 10000) {
              amount = parsedAmount;
              console.log('✓ Extracted AMOUNT:', amount, 'MAD');
              break;
            }
          }
        }
      }
      if (amount) break;
    }

    if (!amount) {
      console.log('✗ No valid AMOUNT found');
    }

    // Extract date (French format: DD-MM-YYYY)
    const datePatterns = [
      /DATE[:\s]*[:]?\s*(\d{2})[-\/](\d{2})[-\/](\d{4})/gi,
      /(\d{2})[-](\d{2})[-](\d{4})/g,
      /(\d{2})[\/](\d{2})[\/](\d{4})/g,
    ];
    
    for (const pattern of datePatterns) {
      const matches = text.match(pattern);
      if (matches) {
        console.log('✓ Date pattern matched:', matches);
        for (const match of matches) {
          const dateMatch = match.match(/(\d{2})[-\/](\d{2})[-\/](\d{4})/);
          if (dateMatch) {
            const day = parseInt(dateMatch[1]);
            const month = parseInt(dateMatch[2]);
            const year = parseInt(dateMatch[3]);
            if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
              date = `${year}-${dateMatch[2]}-${dateMatch[1]}`;
              console.log('✓ Extracted DATE:', dateMatch[1] + '-' + dateMatch[2] + '-' + dateMatch[3], '(DD-MM-YYYY)');
              break;
            }
          }
        }
      }
      if (date) break;
    }

    if (!date) {
      console.log('✗ No valid DATE found');
    }

    console.log('=====================================');
    console.log('📊 EXTRACTION SUMMARY:');
    console.log('  MOTIF:', motif || 'NOT FOUND');
    console.log('  AMOUNT:', amount ? `${amount} MAD` : 'NOT FOUND');
    console.log('  DATE:', date || 'NOT FOUND');
    console.log('=====================================');

    return { motif, amount, date, senderName, rawText: text };
  };

  const processReceiptOCR = async (imageData: string) => {
    setProcessing(true);
    setUploadProgress('Processing receipt...');
    setExtractedData(null);
    setValidationResult(null);

    console.log('🚀 Starting OCR processing...');

    try {
      console.log('📝 Initializing Tesseract worker (French language support)...');
      const worker = await createWorker('fra');
      
      console.log('🔄 Recognizing text from image...');
      const { data: { text } } = await worker.recognize(imageData);
      await worker.terminate();
      console.log('✅ OCR recognition complete');

      const extracted = extractReceiptInfo(text);
      setExtractedData(extracted);

      // Validate extracted data
      const expectedMotif = paymentAlias;
      const expectedAmount = project.price;

      console.log('🔍 VALIDATION CHECK:');
      console.log('  Expected MOTIF:', expectedMotif);
      console.log('  Extracted MOTIF:', extracted.motif);
      console.log('  Expected AMOUNT:', expectedAmount, 'MAD');
      console.log('  Extracted AMOUNT:', extracted.amount, 'MAD');

      // Validate date - must be within last month (30 days) and not in future
      let isDateMatch = false;
      let dateValidationReason = '';
      if (extracted.date) {
        const transactionDate = new Date(extracted.date);
        const now = new Date();
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        
        if (transactionDate > now) {
          isDateMatch = false;
          dateValidationReason = 'Date is in the future';
        } else if (transactionDate < oneMonthAgo) {
          isDateMatch = false;
          dateValidationReason = 'Date is older than 1 month';
        } else {
          isDateMatch = true;
          dateValidationReason = 'Date is valid (within last month)';
        }
        
        console.log('  Extracted DATE:', extracted.date);
        console.log('  Date Range: ', oneMonthAgo.toLocaleDateString(), ' to ', now.toLocaleDateString());
        console.log('  Date validation:', dateValidationReason);
        console.log('  Date is valid:', isDateMatch);
      } else {
        console.log('  No DATE extracted');
      }

      const isMotifMatch = extracted.motif === expectedMotif;
      const isAmountMatch = extracted.amount ? Math.abs(extracted.amount - expectedAmount) <= 10 : false;
      const confidenceScore = (isMotifMatch ? 40 : 0) + (isAmountMatch ? 35 : 0) + (isDateMatch ? 25 : 0);

      console.log('✓ Motif Match:', isMotifMatch);
      console.log('✓ Amount Match:', isAmountMatch);
      console.log('✓ Date Match:', isDateMatch);
      console.log('📊 Confidence Score:', confidenceScore + '%');

      setValidationResult({
        motifMatch: isMotifMatch,
        amountMatch: isAmountMatch,
        dateMatch: isDateMatch,
        confidenceScore,
        expectedMotif,
        expectedAmount
      });

      setUploadProgress('');
      console.log('✅ OCR processing and validation complete');
    } catch (err) {
      console.error('❌ OCR processing error:', err);
      setError('Failed to extract information from receipt. Please try again with a clearer image.');
    } finally {
      setProcessing(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !previewUrl || !extractedData) {
      setError('Please wait for receipt processing to complete');
      return;
    }

    setUploading(true);
    setError(null);
    setUploadProgress('Uploading receipt...');

    try {
      const response = await fetch('/api/projects/upload-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: project.id,
          receiptImage: previewUrl,
          extractedData: extractedData
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setUploadProgress('Payment verified! Project completed.');
        toast.success('🎉 Payment verified! Your project is now complete!', {
          duration: 5000,
          style: {
            background: '#10B981',
            color: '#fff',
          },
        });
        setTimeout(() => {
          onPaymentSubmitted();
          onClose();
        }, 2000);
      } else {
        setError(data.error || 'Failed to upload receipt');
        toast.error('❌ ' + (data.error || 'Failed to upload receipt'), {
          duration: 5000,
        });
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload receipt. Please try again.');
      toast.error('❌ Failed to upload receipt. Please try again.', {
        duration: 5000,
      });
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  // Handle onClose - if blocking, prevent close unless payment is submitted
  const handleClose = () => {
    if (isBlocking && project.paymentStatus !== 'Paid' && project.paymentStatus !== 'Pending') {
      toast.error('⚠️ You must upload a payment receipt before continuing', {
        duration: 4000,
        style: {
          background: '#EF4444',
          color: '#fff',
        },
      });
      return;
    }
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        // Prevent closing when clicking backdrop if blocking
        if (e.target === e.currentTarget && !isBlocking) {
          handleClose();
        } else if (e.target === e.currentTarget && isBlocking) {
          toast.error('⚠️ You must upload a payment receipt before continuing', {
            duration: 4000,
          });
        }
      }}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Payment Required: {project.title}
            </h2>
            {isBlocking && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                ⚠️ Payment is required to access your dashboard
              </p>
            )}
          </div>
          {!isBlocking && (
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 ml-4"
              disabled={uploading}
            >
              <X className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Project Preview Link */}
          {project.previewUrl && (
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
              <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-2 flex items-center gap-2">
                <ExternalLink className="w-4 h-4" />
                Preview Your Project
              </h3>
              <p className="text-sm text-purple-700 dark:text-purple-300 mb-3">
                Click below to view the completed project before making payment
              </p>
              <a
                href={project.previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                View Project Preview
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          )}

          {/* Project Details */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Project Details
            </h3>
            
            {/* Description */}
            {(project.description || project.textInput) && (
              <div className="mb-3">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description:</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                  {project.description || project.textInput}
                </p>
              </div>
            )}

            {/* Logo */}
            {project.logoUrl && (
              <div className="mb-3">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Logo:</p>
                <div className="flex justify-start">
                  <img
                    src={project.logoUrl}
                    alt="Project Logo"
                    className="h-16 w-auto object-contain rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-2"
                  />
                </div>
              </div>
            )}

            {/* Photos */}
            {project.photoUrls && (() => {
              try {
                const photos = JSON.parse(project.photoUrls);
                if (Array.isArray(photos) && photos.length > 0) {
                  return (
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Photos ({photos.length}):
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {photos.map((photo: string, index: number) => (
                          <img
                            key={index}
                            src={photo}
                            alt={`Project photo ${index + 1}`}
                            className="w-full h-20 object-cover rounded border border-gray-300 dark:border-gray-600 cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => window.open(photo, '_blank')}
                          />
                        ))}
                      </div>
                    </div>
                  );
                }
              } catch (error) {
                console.error('Error parsing photos:', error);
              }
              return null;
            })()}

            {/* Voice Memo */}
            {project.voiceMemoUrl && (
              <div className="mb-3">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Voice Memo:</p>
                <audio controls src={project.voiceMemoUrl} className="w-full" />
              </div>
            )}

            {/* Creation Date */}
            {project.createdAt && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Created: {new Date(project.createdAt).toLocaleDateString()}
              </div>
            )}
          </div>

          {/* Payment Info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              Payment Information
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-blue-700 dark:text-blue-300">Project:</span>
                <span className="font-medium text-blue-900 dark:text-blue-100">
                  {project.title}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700 dark:text-blue-300">Amount:</span>
                <span className="font-medium text-blue-900 dark:text-blue-100">
                  {project.price} MAD
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700 dark:text-blue-300">Payment Reference:</span>
                <span className="font-mono font-bold text-blue-900 dark:text-blue-100">
                  {paymentAlias}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Instructions */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
              Payment Instructions
            </h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-yellow-800 dark:text-yellow-200">
              <li>Make a bank transfer to our CIH account</li>
              <li>Use <strong className="font-mono">{paymentAlias}</strong> as payment reference (Motif)</li>
              <li>Download the receipt from your banking app</li>
              <li>Upload the receipt image below</li>
              <li>Wait for admin verification (usually within 24 hours)</li>
            </ol>
          </div>

          {/* Rejection Warning */}
          {project.rejectionCount && project.rejectionCount > 0 && (
            <div className={`border rounded-lg p-4 flex items-start gap-3 ${
              project.rejectionCount >= 2 
                ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-800'
                : 'bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-800'
            }`}>
              <div className="flex-shrink-0">
                {project.rejectionCount >= 2 ? '🚨' : '⚠️'}
              </div>
              <div className="flex-1">
                <p className={`font-semibold mb-1 ${
                  project.rejectionCount >= 2
                    ? 'text-red-900 dark:text-red-100'
                    : 'text-orange-900 dark:text-orange-100'
                }`}>
                  {project.rejectionCount >= 2 ? 'Final Warning!' : 'Payment Rejected'}
                </p>
                <p className={`text-sm mb-2 ${
                  project.rejectionCount >= 2
                    ? 'text-red-800 dark:text-red-200'
                    : 'text-orange-800 dark:text-orange-200'
                }`}>
                  Your previous payment receipt{project.rejectionCount > 1 ? 's were' : ' was'} rejected. 
                  You have <strong>{3 - project.rejectionCount} attempt{3 - project.rejectionCount === 1 ? '' : 's'} remaining</strong>.
                </p>
                <p className={`text-xs ${
                  project.rejectionCount >= 2
                    ? 'text-red-700 dark:text-red-300'
                    : 'text-orange-700 dark:text-orange-300'
                }`}>
                  {project.rejectionCount >= 2 
                    ? '⚠️ After 3 rejections, your project will be permanently rejected and you will need to contact support.'
                    : 'Please ensure your receipt is clear and contains the correct payment reference.'}
                </p>
              </div>
            </div>
          )}

          {/* Status Messages */}
          {project.paymentStatus === 'Pending' && (
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 flex items-start gap-3">
              <Loader2 className="w-5 h-5 text-orange-600 animate-spin flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-orange-900 dark:text-orange-100">Payment Pending Verification</p>
                <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                  A payment receipt has already been uploaded for this project and is waiting for admin verification. You&apos;ll receive an email once it&apos;s approved.
                </p>
                <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">
                  If you believe this is an error or need to update your receipt, please contact support.
                </p>
              </div>
            </div>
          )}

          {project.paymentStatus === 'Paid' && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-green-900 dark:text-green-100">Payment Verified ✓</p>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  Your payment has been verified and approved. Thank you!
                </p>
              </div>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-green-900 dark:text-green-100">Receipt Uploaded Successfully!</p>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  Your payment is now pending admin verification.
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
              <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-900 dark:text-red-100">Error</p>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Upload Area */}
          {!success && project.paymentStatus !== 'Pending' && project.paymentStatus !== 'Paid' && (
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                id="receipt-upload"
                disabled={uploading || processing}
              />
              
              {!selectedFile ? (
                <label
                  htmlFor="receipt-upload"
                  className="flex flex-col items-center justify-center cursor-pointer"
                >
                  <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-3">
                    <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                    Click to upload receipt image
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    PNG, JPG up to 10MB
                  </p>
                </label>
              ) : (
                <div className="space-y-4">
                  <img
                    src={previewUrl || ''}
                    alt="Receipt preview"
                    className="max-w-full h-auto rounded-lg"
                  />
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl(null);
                      setExtractedData(null);
                      setValidationResult(null);
                    }}
                    className="text-sm text-red-600 hover:text-red-700 dark:text-red-400"
                    disabled={uploading || processing}
                  >
                    Remove and select different image
                  </button>

                  {/* Processing Indicator */}
                  {selectedFile && processing && (
                    <div className="flex items-center justify-center gap-2 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                      <span className="text-sm text-blue-700 dark:text-blue-300">
                        Extracting information from receipt...
                      </span>
                    </div>
                  )}

                  {/* Extracted Information Display */}
                  {selectedFile && extractedData && !processing && (
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        Extracted Information
                      </h3>
                      
                      <div className="space-y-2">
                        {/* Payment Reference */}
                        <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
                          <div className="flex-1">
                            <span className="text-xs text-gray-500 dark:text-gray-400">Payment Reference:</span>
                            <p className="text-sm font-mono font-medium text-gray-900 dark:text-white">
                              {extractedData.motif || 'Not found'}
                            </p>
                          </div>
                          {validationResult && (
                            <div className="flex items-center gap-1">
                              {validationResult.motifMatch ? (
                                <>
                                  <Check className="w-4 h-4 text-green-600" />
                                  <span className="text-xs text-green-600 font-medium">Match</span>
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-4 h-4 text-red-600" />
                                  <span className="text-xs text-red-600 font-medium">No Match</span>
                                </>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Amount */}
                        <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
                          <div className="flex-1">
                            <span className="text-xs text-gray-500 dark:text-gray-400">Amount:</span>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {extractedData.amount ? `${extractedData.amount} MAD` : 'Not found'}
                            </p>
                          </div>
                          {validationResult && (
                            <div className="flex items-center gap-1">
                              {validationResult.amountMatch ? (
                                <>
                                  <Check className="w-4 h-4 text-green-600" />
                                  <span className="text-xs text-green-600 font-medium">Match</span>
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-4 h-4 text-red-600" />
                                  <span className="text-xs text-red-600 font-medium">No Match</span>
                                </>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Date */}
                        <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
                          <div className="flex-1">
                            <span className="text-xs text-gray-500 dark:text-gray-400">Transaction Date:</span>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {extractedData.date ? new Date(extractedData.date).toLocaleDateString() : 'Not found'}
                            </p>
                          </div>
                          {validationResult && extractedData.date && (
                            <div className="flex items-center gap-1">
                              {validationResult.dateMatch ? (
                                <>
                                  <Check className="w-4 h-4 text-green-600" />
                                  <span className="text-xs text-green-600 font-medium">Valid</span>
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-4 h-4 text-red-600" />
                                  <span className="text-xs text-red-600 font-medium">Invalid</span>
                                </>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Validation Summary */}
                        {validationResult && (
                          <div className={`mt-3 p-3 rounded-lg ${
                            validationResult.confidenceScore >= 80 
                              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                              : validationResult.confidenceScore >= 50
                              ? 'bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800'
                              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                          }`}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                Validation Confidence:
                              </span>
                              <span className={`text-sm font-bold ${
                                validationResult.confidenceScore >= 80 
                                  ? 'text-green-700 dark:text-green-300'
                                  : validationResult.confidenceScore >= 50
                                  ? 'text-orange-700 dark:text-orange-300'
                                  : 'text-red-700 dark:text-red-300'
                              }`}>
                                {validationResult.confidenceScore}%
                              </span>
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              {validationResult.confidenceScore >= 80 && (
                                <p>✓ All information matches expected values and date is within last month</p>
                              )}
                              {validationResult.confidenceScore >= 50 && validationResult.confidenceScore < 80 && (
                                <p>⚠️ Some information doesn&apos;t match or date is invalid (too old or future date). Admin will verify manually.</p>
                              )}
                              {validationResult.confidenceScore < 50 && (
                                <p>✗ Multiple mismatches detected or invalid date. Please ensure you uploaded the correct and recent receipt (within last month).</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-900 px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-between gap-3">
          <div className="flex gap-3">
            {isBlocking && (
              <button
                onClick={() => {
                  // Sign out the user
                  window.location.href = '/api/auth/signout';
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            )}
            {!isBlocking && (
              <button
                onClick={handleClose}
                disabled={uploading}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            )}
          </div>
          <div className="flex gap-3">
            {!success && project.paymentStatus !== 'Pending' && project.paymentStatus !== 'Paid' && (
              <button
                onClick={handleUpload}
                disabled={!selectedFile || uploading || processing || !extractedData}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
                {uploading ? 'Uploading...' : 'Upload Receipt'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
