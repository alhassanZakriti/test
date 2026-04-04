'use client';

import { useState, useEffect } from 'react';
import { X, Upload, CheckCircle, AlertCircle, Loader2, Check, XCircle, LogOut } from 'lucide-react';
import Image from 'next/image';
import { createWorker } from 'tesseract.js';
import { useLanguage } from '@/contexts/LanguageContext';
import { Locale, locales, localeFlags, localeNames } from '@/lib/i18n';
import { signOut } from 'next-auth/react';

interface SubscriptionStatus {
  needsPayment: boolean;
  status: string;
  daysRemaining: number;
  expirationDate: string | null;
  paymentAlias: string;
  message?: string;
  lastPayment?: {
    amount: number;
    date: string;
    verified: boolean;
  };
}

interface PaymentVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscriptionStatus: SubscriptionStatus | null;
  onPaymentSubmitted: () => void;
  isBlocking?: boolean; // Modal cannot be closed if true (for new users or expired subscriptions)
}

export default function PaymentVerificationModal({
  isOpen,
  onClose,
  subscriptionStatus,
  onPaymentSubmitted,
  isBlocking = false
}: PaymentVerificationModalProps) {
  const { t, locale, setLocale } = useLanguage();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [showLangMenu, setShowLangMenu] = useState(false);

  // Prevent closing the modal if it's blocking
  const handleClose = () => {
    if (isBlocking && !success) {
      // Show a toast or warning that payment is required
      return;
    }
    onClose();
  };

  // Prevent ESC key from closing modal when blocking
  useEffect(() => {
    if (isBlocking && isOpen) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
        }
      };
      window.addEventListener('keydown', handleKeyDown, true);
      return () => window.removeEventListener('keydown', handleKeyDown, true);
    }
  }, [isBlocking, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setSelectedFile(null);
      setPreviewUrl(null);
      setError(null);
      setSuccess(false);
      setExtractedData(null);
      setValidationResult(null);
      setProcessing(false);
    }
  }, [isOpen]);

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = document.createElement('img');
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Resize if image is too large
          const maxDimension = 1200;
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = (height * maxDimension) / width;
              width = maxDimension;
            } else {
              width = (width * maxDimension) / height;
              height = maxDimension;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          // Compress to JPEG with 0.8 quality
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
          resolve(compressedBase64);
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }

      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }

      setSelectedFile(file);
      setError(null);

      try {
        // Compress image before preview
        const compressedImage = await compressImage(file);
        setPreviewUrl(compressedImage);
        
        // Start OCR processing immediately
        await processReceiptOCR(compressedImage);
      } catch (err) {
        setError('Failed to process image');
        console.error('Image compression error:', err);
      }
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
      /MOTIF[:\s]*[:]?\s*(MOD[A-Z0-9]{8})/gi,      // MOTIF: MODXXXXXXXX or MOTIF MODXXXXXXXX
      /MOTIF[:\s]+([A-Z0-9]{11})/gi,                // MOTIF: followed by 11 chars
      /MOD[A-Z0-9]{8}/gi,                           // Direct MODXXXXXXXX
    ];
    
    for (const pattern of modPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        console.log('✓ Motif pattern matched:', matches);
        // Extract the MOD part
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
      /MONTANT[:\s]*[:]?\s*(\d{1,6})[.,]?(\d{0,2})\s*(?:DIRHAMS?|MAD|DH)/gi,  // MONTANT: XXX Dirhams
      /MONTANT[:\s]*[:]?\s*(\d{1,6})[.,]?(\d{0,2})/gi,                        // MONTANT: XXX
      /(\d{1,6})[.,](\d{2})\s*(?:DIRHAMS?|MAD|DH)/gi,                         // XXX.XX Dirhams
      /(\d{1,6})\s*(?:DIRHAMS?|MAD|DH)/gi                                      // XXX Dirhams
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
      /DATE[:\s]*[:]?\s*(\d{2})[-\/](\d{2})[-\/](\d{4})/gi,  // DATE: DD-MM-YYYY or DD/MM/YYYY
      /(\d{2})[-](\d{2})[-](\d{4})/g,                        // DD-MM-YYYY
      /(\d{2})[\/](\d{2})[\/](\d{4})/g,                      // DD/MM/YYYY
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
              date = `${year}-${dateMatch[2]}-${dateMatch[1]}`; // Store as YYYY-MM-DD
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
      const worker = await createWorker('fra'); // Use French language for better OCR
      
      console.log('🔄 Recognizing text from image...');
      const { data: { text } } = await worker.recognize(imageData);
      await worker.terminate();
      console.log('✅ OCR recognition complete');

      const extracted = extractReceiptInfo(text);
      setExtractedData(extracted);

      // Validate extracted data
      const expectedMotif = subscriptionStatus?.paymentAlias || '';
      const expectedAmount = 150; // Default subscription price

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
      const response = await fetch('/api/user/upload-receipt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receiptImage: previewUrl,
          extractedData: extractedData
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload receipt');
      }

      setUploadProgress('');
      setSuccess(true);
      
      // Notify parent component
      setTimeout(() => {
        onPaymentSubmitted();
      }, 3000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload receipt');
      setUploadProgress('');
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Blocking overlay for visual effect */}
      {isBlocking && (
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
          onClick={(e) => e.preventDefault()}
        />
      )}
      
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              {/* Language Toggle */}
              <div className="flex relative justify-center mx-auto">
                <button
                  onClick={() => setShowLangMenu(!showLangMenu)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  <span className="text-xl">{localeFlags[locale]}</span>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{localeNames[locale]}</span>
                </button>
                {showLangMenu && (
                  <div className="absolute  mt-[3em] w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                    {locales.map((lang) => (
                      <button
                        key={lang}
                        onClick={() => {
                          setLocale(lang);
                          setShowLangMenu(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                          locale === lang ? 'bg-purple-50 dark:bg-purple-900/20' : ''
                        }`}
                      >
                        <span className="text-xl">{localeFlags[lang]}</span>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{localeNames[lang]}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            <div className="flex items-center mt-4 justify-between">
              <div className="flex-1">
                <h2 className="text-2xl text-center font-bold text-gray-900 dark:text-white">
                  {t('paymentModal.title')}
                  <br/>
                  {isBlocking && (
                    <span className=" text-sm font-normal text-red-600  dark:text-red-400">
                      {t('paymentModal.blockingWarning')}
                    </span>
                  )}
                </h2>
                <p className="text-sm text-center text-gray-600 dark:text-gray-400 mt-1">
                  {subscriptionStatus?.status === 'Expired' 
                    ? t('paymentModal.expiredMessage')
                    : subscriptionStatus?.status === 'Pending Verification'
                    ? t('paymentModal.pendingMessage')
                    : t('paymentModal.defaultMessage')}
                </p>
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

            {/* Deposit Notice */}
            <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                  </svg>
                </div>
                <div className="flex-1 space-y-2">
                  <p className="text-lg text-gray-700 dark:text-gray-300 font-[800] leading-relaxed">
                    {t('paymentModal.depositNotice')}
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-md font-bold text-blue-700 dark:text-blue-400">50</span>
                    <span className="text-md font-semibold text-gray-900 dark:text-white">Dirham, </span>
                    <span className="text-md text-white  ">{t('paymentModal.depositAmount').replace('50 Dirham', '').replace('Therefore, we ask for a small initial contribution of', 'initial contribution required').trim()}</span>
                  </div>
                  <p className="text-sm text-green-700 dark:text-green-400 font-medium flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                    {t('paymentModal.depositCredit')}
                  </p>
                </div>
              </div>
            </div>
          </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Subscription Info */}
          {/* {subscriptionStatus && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                {t('paymentModal.subscriptionInfo')}
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-700 dark:text-blue-300">{t('paymentModal.status')}:</span>
                  <span className="font-medium text-blue-900 dark:text-blue-100">
                    {subscriptionStatus.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700 dark:text-blue-300">{t('paymentModal.daysRemaining')}:</span>
                  <span className="font-medium text-blue-900 dark:text-blue-100">
                    {subscriptionStatus.daysRemaining} {t('paymentModal.days')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700 dark:text-blue-300">{t('paymentModal.paymentReference')}:</span>
                  <span className="font-mono font-bold text-blue-900 dark:text-blue-100">
                    {subscriptionStatus.paymentAlias}
                  </span>
                </div>
              </div>
            </div>
          )} */}

          {/* Payment Instructions */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
              {t('paymentModal.paymentInstructions')}
            </h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-yellow-800 dark:text-yellow-200">
              <li>{t('paymentModal.instruction1')}</li>
              <li>{t('common.use')} <strong className="font-mono">{subscriptionStatus?.paymentAlias}</strong> {t('paymentModal.instruction2')}</li>
              <li>{t('paymentModal.instruction3')}</li>
              <li>{t('paymentModal.instruction4')}</li>
              <li>{t('paymentModal.instruction5')}</li>
            </ol>
          </div>

          {/* Bank Details */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-5">
            <h3 className="font-bold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
              🏦 {t('paymentModal.bankDetails')}
            </h3>
            <div className="space-y-2.5  text-sm bg-white/50 dark:bg-gray-800/50 rounded-lg p-4">
              <div className="flex flex-col justify-between lt-sm:flex-row items-center border-b border-blue-100 dark:border-blue-800 pb-2">
                <span className="text-blue-700 dark:text-blue-300 font-medium">{t('paymentModal.bankName')}</span>
                <span className="font-semibold text-blue-900 dark:text-blue-100">CIH Bank</span>
              </div>
              <div className="flex flex-col lt-sm:flex-row justify-between items-center border-b border-blue-100 dark:border-blue-800 pb-2">
                <span className="text-blue-700 dark:text-blue-300 font-medium">{t('paymentModal.accountNumber')}</span>
                <span className="font-mono font-semibold text-blue-900 dark:text-blue-100">230 780 214522050000 51 91</span>
              </div>
              <div className="flex flex-col lt-sm:flex-row justify-between items-center border-b border-blue-100 dark:border-blue-800 pb-2">
                <span className="text-blue-700 dark:text-blue-300 font-medium">{t('paymentModal.accountHolder')}</span>
                <span className="font-semibold text-blue-900 dark:text-blue-100">MODUAL TECH</span>
              </div>
              <div className="flex flex-col lt-sm:flex-row justify-between items-center">
                <span className="text-blue-700 dark:text-blue-300 font-medium">{t('paymentModal.paymentReference')}</span>
                <span className="font-mono font-bold text-lg text-blue-900 dark:text-blue-100">{subscriptionStatus?.paymentAlias}</span>
              </div>
            </div>
            <div className="mt-3 text-xs text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30 rounded p-2 flex items-start gap-2">
              <span className="text-base">⚠️</span>
              <span>{t('paymentModal.importantNote')} <strong className="font-mono">{subscriptionStatus?.paymentAlias}</strong> {t('paymentModal.importantNote2')}</span>
            </div>
          </div>

          {/* Support Contact */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-lg p-5">
            <h3 className="font-bold text-green-900 dark:text-green-100 mb-3 flex items-center gap-2">
              💬 {t('paymentModal.supportTitle')}
            </h3>
            <p className="text-sm text-green-800 dark:text-green-200 mb-3">
              {t('paymentModal.supportDescription')}
            </p>
            <div className="space-y-2.5 bg-white/50 dark:bg-gray-800/50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-300" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-green-600 dark:text-green-400 font-medium">{t('paymentModal.supportWhatsApp')}</p>
                  <a 
                    href="https://wa.me/212637655794" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-green-900 dark:text-green-100 hover:underline"
                  >
                    +212 637-655794
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-green-600 dark:text-green-400 font-medium">{t('paymentModal.supportEmail')}</p>
                  <a 
                    href="mailto:info@modual.ma" 
                    className="text-sm font-semibold text-green-900 dark:text-green-100 hover:underline"
                  >
                    info@modual.ma
                  </a>
                </div>
              </div>
            </div>
            <div className="mt-3 text-xs text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/30 rounded p-2">
              ⏰ {t('paymentModal.supportResponse')}
            </div>
          </div>

          {/* Status Messages */}
          {subscriptionStatus?.status === 'Pending Verification' && (
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-orange-900 dark:text-orange-100">
                  Payment Under Review
                </h4>
                <p className="text-sm text-orange-800 dark:text-orange-200 mt-1">
                  Your payment receipt has been submitted and is currently being verified by our admin team.
                You&apos;ll receive a notification once it&apos;s approved.
                </p>
                {subscriptionStatus.lastPayment && (
                  <div className="mt-2 text-sm text-orange-700 dark:text-orange-300">
                    Last submission: {new Date(subscriptionStatus.lastPayment.date).toLocaleDateString()} - 
                    Amount: {subscriptionStatus.lastPayment.amount} MAD
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-green-900 dark:text-green-100">
                  Receipt Uploaded Successfully!
                </h4>
                <p className="text-sm text-green-800 dark:text-green-200 mt-1">
                  {extractedData?.message || 'Your receipt is being processed in the background. You can leave this page - we will send you an email notification once your payment has been verified by our admin team.'}
                </p>
                <div className="mt-3 p-3 bg-green-100 dark:bg-green-900/40 rounded-md">
                  <p className="text-xs text-green-700 dark:text-green-300">
                    <strong>📧 Email Notification:</strong> You will receive an email when your payment is approved or if additional information is needed.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-red-900 dark:text-red-100">Error</h4>
                <p className="text-sm text-red-800 dark:text-red-200 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Upload Area */}
          {!success && subscriptionStatus?.status !== 'Pending Verification' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('paymentModal.uploadLabel')}
              </label>
              
              {!previewUrl ? (
                <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-12 h-12 text-gray-400 mb-3" />
                    <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-semibold">{t('paymentModal.clickToUpload')}</span> {t('paymentModal.dragAndDrop')}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {t('paymentModal.fileFormats')}
                    </p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileSelect}
                    disabled={uploading}
                  />
                </label>
              ) : (
                <div className="space-y-4">
                  <div className="relative w-full h-64 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                    <Image
                      src={previewUrl}
                      alt={t('paymentModal.receiptPreview')}
                      fill
                      className="object-contain"
                    />
                  </div>
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
                    {t('paymentModal.removeImage')}
                  </button>

                  {/* Processing Indicator */}
                  {processing && (
                    <div className="flex items-center justify-center gap-2 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                      <span className="text-sm text-blue-700 dark:text-blue-300">
                        {t('paymentModal.extractingInfo')}
                      </span>
                    </div>
                  )}

                  {/* Extracted Information Display */}
                  {extractedData && !processing && (
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        {t('paymentModal.extractedInfo')}
                      </h3>
                      
                      <div className="space-y-2">
                        {/* Payment Reference */}
                        <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
                          <div className="flex-1">
                            <span className="text-xs text-gray-500 dark:text-gray-400">{t('paymentModal.paymentReference')}:</span>
                            <p className="text-sm font-mono font-medium text-gray-900 dark:text-white">
                              {extractedData.motif || t('paymentModal.notFound')}
                            </p>
                          </div>
                          {validationResult && (
                            <div className="flex items-center gap-1">
                              {validationResult.motifMatch ? (
                                <>
                                  <Check className="w-4 h-4 text-green-600" />
                                  <span className="text-xs text-green-600 font-medium">{t('paymentModal.match')}</span>
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-4 h-4 text-red-600" />
                                  <span className="text-xs text-red-600 font-medium">{t('paymentModal.noMatch')}</span>
                                </>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Amount */}
                        <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
                          <div className="flex-1">
                            <span className="text-xs text-gray-500 dark:text-gray-400">{t('paymentModal.amount')}:</span>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {extractedData.amount ? `${extractedData.amount} MAD` : t('paymentModal.notFound')}
                            </p>
                          </div>
                          {validationResult && (
                            <div className="flex items-center gap-1">
                              {validationResult.amountMatch ? (
                                <>
                                  <Check className="w-4 h-4 text-green-600" />
                                  <span className="text-xs text-green-600 font-medium">{t('paymentModal.match')}</span>
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-4 h-4 text-red-600" />
                                  <span className="text-xs text-red-600 font-medium">{t('paymentModal.noMatch')}</span>
                                </>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Date */}
                        <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
                          <div className="flex-1">
                            <span className="text-xs text-gray-500 dark:text-gray-400">{t('paymentModal.transactionDate')}:</span>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {extractedData.date ? new Date(extractedData.date).toLocaleDateString() : t('paymentModal.notFound')}
                            </p>
                          </div>
                          {validationResult && extractedData.date && (
                            <div className="flex items-center gap-1">
                              {validationResult.dateMatch ? (
                                <>
                                  <Check className="w-4 h-4 text-green-600" />
                                  <span className="text-xs text-green-600 font-medium">{t('paymentModal.valid')}</span>
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-4 h-4 text-red-600" />
                                  <span className="text-xs text-red-600 font-medium">{t('paymentModal.invalid')}</span>
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
                                {t('paymentModal.validationConfidence')}:
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
                                <p>✓ {t('paymentModal.validationHigh')}</p>
                              )}
                              {validationResult.confidenceScore >= 50 && validationResult.confidenceScore < 80 && (
                                <p>⚠️ {t('paymentModal.validationMedium')}</p>
                              )}
                              {validationResult.confidenceScore < 50 && (
                                <p>✗ {t('paymentModal.validationLow')}</p>
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
        {!success && subscriptionStatus?.status !== 'Pending Verification' && (
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
            {!isBlocking && (
              <button
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                disabled={uploading}
              >
                {t('paymentModal.cancel')}
              </button>
            )}
            <div className="flex flex-col items-end gap-2">
              {uploadProgress && (
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  {uploadProgress}
                </p>
              )}
              <button
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t('paymentModal.processing')}
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    {t('paymentModal.uploadReceipt')}
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Logout */}
        <div className="flex items-center justify-center p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            {t('nav.logout')}
          </button>
        </div>
      </div>
    </div>
    </>
  );
}
