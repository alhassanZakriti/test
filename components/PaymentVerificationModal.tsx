'use client';

import { useState, useEffect } from 'react';
import { X, Upload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import Image from 'next/image';

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
}

export default function PaymentVerificationModal({
  isOpen,
  onClose,
  subscriptionStatus,
  onPaymentSubmitted
}: PaymentVerificationModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);

  useEffect(() => {
    if (!isOpen) {
      setSelectedFile(null);
      setPreviewUrl(null);
      setError(null);
      setSuccess(false);
      setExtractedData(null);
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
      } catch (err) {
        setError('Failed to process image');
        console.error('Image compression error:', err);
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !previewUrl) return;

    setUploading(true);
    setError(null);
    setUploadProgress('Preparing image...');

    try {
      setUploadProgress('Uploading receipt...');
      
      const response = await fetch('/api/user/upload-receipt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receiptImage: previewUrl
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload receipt');
      }

      setUploadProgress('');
      setSuccess(true);
      setExtractedData(data);
      
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Payment Verification Required
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {subscriptionStatus?.status === 'Expired' 
                ? 'Your subscription has expired. Please upload your payment receipt.'
                : subscriptionStatus?.status === 'Pending Verification'
                ? 'Your payment is being verified by our team.'
                : 'Please upload your payment receipt to continue using the platform.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            disabled={uploading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Subscription Info */}
          {subscriptionStatus && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Subscription Information
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-700 dark:text-blue-300">Status:</span>
                  <span className="font-medium text-blue-900 dark:text-blue-100">
                    {subscriptionStatus.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700 dark:text-blue-300">Days Remaining:</span>
                  <span className="font-medium text-blue-900 dark:text-blue-100">
                    {subscriptionStatus.daysRemaining} days
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700 dark:text-blue-300">Payment Reference:</span>
                  <span className="font-mono font-bold text-blue-900 dark:text-blue-100">
                    {subscriptionStatus.paymentAlias}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Payment Instructions */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
              Payment Instructions
            </h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-yellow-800 dark:text-yellow-200">
              <li>Make a bank transfer to our CIH account</li>
              <li>Use <strong className="font-mono">{subscriptionStatus?.paymentAlias}</strong> as payment reference (Motif)</li>
              <li>Download the receipt from your banking app</li>
              <li>Upload the receipt image below</li>
              <li>Wait for admin verification (usually within 24 hours)</li>
            </ol>
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
                Upload Payment Receipt
              </label>
              
              {!previewUrl ? (
                <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-12 h-12 text-gray-400 mb-3" />
                    <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      PNG, JPG or JPEG (MAX. 10MB - Automatically compressed)
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
                      alt="Receipt preview"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl(null);
                    }}
                    className="text-sm text-red-600 hover:text-red-700 dark:text-red-400"
                    disabled={uploading}
                  >
                    Remove and select different image
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!success && subscriptionStatus?.status !== 'Pending Verification' && (
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              disabled={uploading}
            >
              Cancel
            </button>
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
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Upload Receipt
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
