'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';

export default function AdminPaymentsPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        setCsvFile(file);
        setError(null);
      } else {
        setError('Please select a valid CSV file');
        setCsvFile(null);
      }
    }
  };

  const parseCSV = (text: string) => {
    const lines = text.trim().split('\n');
    const data = [];

    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Split by comma, but handle quoted values
      const matches = line.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g);
      if (!matches || matches.length < 3) continue;

      const [date, amount, description, senderName = ''] = matches.map((m) =>
        m.replace(/^"|"$/g, '').trim()
      );

      data.push({
        date,
        amount,
        description,
        senderName,
      });
    }

    return data;
  };

  const handleUpload = async () => {
    if (!csvFile) {
      setError('Please select a file first');
      return;
    }

    setProcessing(true);
    setError(null);
    setResults(null);

    try {
      // Read CSV file
      const text = await csvFile.text();
      const csvData = parseCSV(text);

      if (csvData.length === 0) {
        setError('No valid data found in CSV file');
        setProcessing(false);
        return;
      }

      // Send to API
      const response = await fetch('/api/admin/payments/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ csvData }),
      });

      if (!response.ok) {
        throw new Error('Failed to process payments');
      }

      const data = await response.json();
      setResults(data.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin"
            className="text-purple-600 dark:text-purple-400 hover:underline mb-4 inline-block"
          >
            ← Back to Admin Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            💳 Payment Tracking
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Upload CIH bank CSV file to automatically match payments and notify clients
          </p>
        </div>

        {/* Upload Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            📤 Upload Bank CSV
          </h2>
          
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="csv-upload"
              />
              <label
                htmlFor="csv-upload"
                className="cursor-pointer inline-flex flex-col items-center"
              >
                <svg
                  className="w-12 h-12 text-gray-400 mb-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Click to select CSV file
                </span>
              </label>
              {csvFile && (
                <p className="mt-3 text-sm text-purple-600 dark:text-purple-400">
                  Selected: {csvFile.name}
                </p>
              )}
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                📋 CSV Format Required:
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                Your CSV file should have these columns (with header row):
              </p>
              <code className="block text-xs bg-white dark:bg-gray-800 p-2 rounded">
                Date,Amount,Description,Sender Name
              </code>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                Example: 2025-12-04,150,Payment MOD-1234,John Doe
              </p>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={!csvFile || processing}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {processing ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Processing Payments...
                </span>
              ) : (
                '🚀 Process Payments'
              )}
            </button>
          </div>
        </div>

        {/* Results Section */}
        {results && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              📊 Processing Results
            </h2>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {results.matched}
                </div>
                <div className="text-sm text-green-800 dark:text-green-200">
                  ✅ Matched & Notified
                </div>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {results.unmatched}
                </div>
                <div className="text-sm text-yellow-800 dark:text-yellow-200">
                  ⚠️ Unmatched
                </div>
              </div>

              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {results.errors}
                </div>
                <div className="text-sm text-red-800 dark:text-red-200">
                  ❌ Errors
                </div>
              </div>
            </div>

            {/* Details */}
            {results.details && results.details.length > 0 && (
              <div className="overflow-x-auto">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                  Transaction Details:
                </h3>
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Code
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Client
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {results.details.map((detail: any, index: number) => (
                      <tr key={index}>
                        <td className="px-4 py-3 text-sm font-mono text-gray-900 dark:text-gray-100">
                          {detail.code || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                          {detail.userName || detail.userEmail || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span
                            className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                              detail.status === 'Success'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200'
                                : detail.status === 'Error'
                                ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200'
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200'
                            }`}
                          >
                            {detail.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="mt-6 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6">
          <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-3">
            💡 How it works:
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-purple-800 dark:text-purple-200">
            <li>Export transactions from CIH bank as CSV</li>
            <li>Upload the CSV file using the form above</li>
            <li>System automatically matches MOD-XXXX codes with subscriptions</li>
            <li>Verified payments update subscription status to "Paid"</li>
            <li>Clients receive automatic email + WhatsApp notifications</li>
            <li>View results and any unmatched transactions</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
