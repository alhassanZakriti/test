'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { CheckCircle, XCircle, Clock, Eye, Search, Filter } from 'lucide-react';

interface Payment {
  id: string;
  amount: number;
  transactionDate: string;
  bankReference: string | null;
  senderName: string | null;
  receiptUrl: string | null;
  receiptData: any;
  verified: boolean;
  createdAt: string;
  subscription: {
    id: string;
    uniqueCode: string;
    plan: string;
    user: {
      id: string;
      name: string | null;
      email: string;
      phoneNumber: string | null;
    };
  };
}

export default function AdminPaymentVerificationPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'verified'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/inloggen');
    } else if (status === 'authenticated') {
      fetchPayments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, router, filter]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/payments/verify?filter=${filter}`);
      const data = await response.json();

      if (response.ok) {
        setPayments(data.payments || []);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (paymentId: string, approve: boolean) => {
    try {
      const response = await fetch('/api/admin/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId, approve })
      });

      const data = await response.json();

      if (response.ok) {
        // Refresh payments list
        fetchPayments();
        setSelectedPayment(null);
      } else {
        alert(data.error || 'Failed to verify payment');
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      alert('Failed to verify payment');
    }
  };

  const filteredPayments = payments.filter(payment => {
    const searchLower = searchTerm.toLowerCase();
    return (
      payment.bankReference?.toLowerCase().includes(searchLower) ||
      payment.subscription.user.email.toLowerCase().includes(searchLower) ||
      payment.subscription.user.name?.toLowerCase().includes(searchLower) ||
      payment.subscription.uniqueCode.toLowerCase().includes(searchLower)
    );
  });

  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Payment Verification
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Review and verify customer payment receipts
        </p>
      </div>

      {/* Filters and Search */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            All ({payments.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'pending'
                ? 'bg-orange-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter('verified')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'verified'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Verified
          </button>
        </div>

        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by reference, email, or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Payments List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredPayments.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
            <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No payments to display</p>
          </div>
        ) : (
          filteredPayments.map((payment) => (
            <div
              key={payment.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
            >
              <div className="flex flex-col md:flex-row gap-6">
                {/* Payment Info */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {payment.subscription.user.name || payment.subscription.user.email}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {payment.subscription.user.email}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        payment.verified
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                      }`}
                    >
                      {payment.verified ? 'Verified' : 'Pending'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Amount</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {payment.amount} MAD
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Reference</p>
                      <p className="text-sm font-mono font-semibold text-gray-900 dark:text-white">
                        {payment.bankReference || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Transaction Date</p>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {new Date(payment.transactionDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Plan</p>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {payment.subscription.plan}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  {!payment.verified && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleVerify(payment.id, true)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleVerify(payment.id, false)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                      <button
                        onClick={() => setSelectedPayment(payment)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        View Receipt
                      </button>
                    </div>
                  )}
                </div>

                {/* Receipt Thumbnail */}
                {payment.receiptUrl && (
                  <div className="w-full md:w-48 h-48 relative bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                    <Image
                      src={payment.receiptUrl}
                      alt="Receipt"
                      fill
                      className="object-contain cursor-pointer hover:opacity-75 transition-opacity"
                      onClick={() => setSelectedPayment(payment)}
                    />
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Receipt Modal */}
      {selectedPayment && selectedPayment.receiptUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4"
          onClick={() => setSelectedPayment(null)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Payment Receipt
                </h3>
                <button
                  onClick={() => setSelectedPayment(null)}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  ✕
                </button>
              </div>

              <div className="relative w-full h-[70vh] bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden mb-4">
                <Image
                  src={selectedPayment.receiptUrl}
                  alt="Receipt"
                  fill
                  className="object-contain"
                />
              </div>

              {/* Extracted Data */}
              {selectedPayment.receiptData && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Extracted Information
                  </h4>
                  <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {JSON.stringify(JSON.parse(selectedPayment.receiptData), null, 2)}
                  </pre>
                </div>
              )}

              {!selectedPayment.verified && (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleVerify(selectedPayment.id, true)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Approve Payment
                  </button>
                  <button
                    onClick={() => handleVerify(selectedPayment.id, false)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                  >
                    <XCircle className="w-5 h-5" />
                    Reject Payment
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
