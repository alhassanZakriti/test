'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { CheckCircle, XCircle, Clock, Eye, Search, Filter, ExternalLink } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface ProjectPayment {
  id: string;
  amount: number;
  transactionDate: string;
  bankReference: string | null;
  senderName: string | null;
  receiptUrl: string | null;
  receiptData: any;
  verified: boolean;
  createdAt: string;
  project: {
    id: string;
    title: string;
    status: string;
    previewUrl: string | null;
    paymentStatus: string;
    price: number;
    user: {
      id: string;
      name: string | null;
      email: string;
      phoneNumber: string | null;
    };
  };
}

export default function AdminProjectPaymentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useLanguage();
  const [payments, setPayments] = useState<ProjectPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'verified'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<ProjectPayment | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/inloggen');
    } else if (status === 'authenticated') {
      fetchPayments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, router, filter]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/project-payments?filter=${filter}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch payments');
      }
      
      const data = await response.json();
      setPayments(data);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (paymentId: string, verified: boolean) => {
    try {
      const response = await fetch('/api/admin/project-payments/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paymentId, verified }),
      });

      if (!response.ok) {
        throw new Error('Failed to verify payment');
      }

      // Refresh payments list
      fetchPayments();
      setSelectedPayment(null);
    } catch (error) {
      console.error('Error verifying payment:', error);
      alert('Failed to verify payment');
    }
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = 
      payment.project.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.project.user.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading payments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Project Payment Verification
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Review and verify project payment receipts
          </p>
        </div>

        {/* Filters and Search */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6 mb-6">
          <div className="flex flex-col gap-4">
            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilter('pending')}
                className={`px-3 sm:px-4 py-2 text-sm sm:text-base rounded-lg transition-colors ${
                  filter === 'pending'
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                <Clock className="inline-block mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                Pending
              </button>
              <button
                onClick={() => setFilter('verified')}
                className={`px-3 sm:px-4 py-2 text-sm sm:text-base rounded-lg transition-colors ${
                  filter === 'verified'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                <CheckCircle className="inline-block mr-2 h-4 w-4" />
                Verified
              </button>
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filter === 'all'
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                <Filter className="inline-block mr-2 h-4 w-4" />
                All
              </button>
            </div>

            {/* Search */}
            <div className="relative w-full md:w-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search by email, name, or project..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full md:w-80 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Payments List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          {filteredPayments.length === 0 ? (
            <div className="p-12 text-center">
              <Clock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                No {filter !== 'all' ? filter : ''} payments found
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Project
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Transaction Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {payment.project.user.name || 'N/A'}
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {payment.project.user.email}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {payment.project.title}
                          </span>
                          {payment.project.previewUrl && (
                            <a
                              href={payment.project.previewUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink className="h-3 w-3" />
                              View Preview
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {payment.amount} MAD
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900 dark:text-white">
                          {new Date(payment.transactionDate).toLocaleDateString('en-GB')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {payment.verified ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100">
                            <Clock className="h-3 w-3 mr-1" />
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => setSelectedPayment(payment)}
                          className="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Payment Detail Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Payment Details
              </h2>
            </div>

            <div className="p-6 space-y-6">
              {/* Project Information */}
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Project Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Project Title</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedPayment.project.title}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Project Price</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedPayment.project.price} MAD
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Project Status</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedPayment.project.status === 'NEW' || selectedPayment.project.status === 'New' ? t('common.new') :
                       selectedPayment.project.status === 'IN_PROGRESS' || selectedPayment.project.status === 'In Progress' ? t('common.inProgress') :
                       selectedPayment.project.status === 'PREVIEW' ? t('admin.preview') :
                       selectedPayment.project.status === 'COMPLETE' || selectedPayment.project.status === 'Completed' ? t('admin.complete') :
                       selectedPayment.project.status}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Payment Status</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedPayment.project.paymentStatus}
                    </p>
                  </div>
                  {selectedPayment.project.previewUrl && (
                    <div className="col-span-2">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Preview URL</p>
                      <a
                        href={selectedPayment.project.previewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        <ExternalLink className="h-4 w-4" />
                        View Project Preview
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* User Information */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  User Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Name</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedPayment.project.user.name || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedPayment.project.user.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Phone</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedPayment.project.user.phoneNumber || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Payment Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Amount</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedPayment.amount} MAD
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Transaction Date</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {new Date(selectedPayment.transactionDate).toLocaleDateString('en-GB')}
                    </p>
                  </div>
                  {selectedPayment.bankReference && (
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Bank Reference</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {selectedPayment.bankReference}
                      </p>
                    </div>
                  )}
                  {selectedPayment.senderName && (
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Sender Name</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {selectedPayment.senderName}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Submitted At</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {new Date(selectedPayment.createdAt).toLocaleString('en-GB')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedPayment.verified ? 'Verified' : 'Pending Verification'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Receipt Image */}
              {selectedPayment.receiptUrl && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Receipt Image
                  </h3>
                  <div className="relative aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                    <Image
                      src={selectedPayment.receiptUrl}
                      alt="Payment Receipt"
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>
              )}

              {/* Extracted Data */}
              {selectedPayment.receiptData && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Extracted Data
                  </h3>
                  <pre className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg text-sm overflow-x-auto">
                    {JSON.stringify(selectedPayment.receiptData, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3">
              <button
                onClick={() => setSelectedPayment(null)}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
              {!selectedPayment.verified && (
                <>
                  <button
                    onClick={() => handleVerify(selectedPayment.id, false)}
                    className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <XCircle className="h-5 w-5" />
                    Reject
                  </button>
                  <button
                    onClick={() => handleVerify(selectedPayment.id, true)}
                    className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="h-5 w-5" />
                    Approve
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
