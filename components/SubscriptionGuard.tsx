'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import PaymentVerificationModal from './PaymentVerificationModal';

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

export default function SubscriptionGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasChecked, setHasChecked] = useState(false);

  const checkSubscription = async () => {
    if (status !== 'authenticated' || !session?.user) {
      setLoading(false);
      return;
    }

    try {
      // Check if user is admin first
      const userResponse = await fetch('/api/user/me');
      const userData = await userResponse.json();
      
      // Admins have full access without subscription checks
      if (userData.user?.role === 'admin') {
        setLoading(false);
        setHasChecked(true);
        return;
      }

      const response = await fetch('/api/user/subscription-status');
      const data = await response.json();

      if (response.ok) {
        setSubscriptionStatus(data);
        
        // Show modal if payment is needed and not pending verification
        if (data.needsPayment && data.status !== 'Pending Verification') {
          setShowModal(true);
        }
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
    } finally {
      setLoading(false);
      setHasChecked(true);
    }
  };

  useEffect(() => {
    if (!hasChecked) {
      checkSubscription();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session, hasChecked]);

  const handlePaymentSubmitted = () => {
    // Refresh subscription status
    checkSubscription();
    setShowModal(false);
  };

  const handleCloseModal = () => {
    // Only allow closing if payment is not urgently needed
    if (subscriptionStatus?.daysRemaining && subscriptionStatus.daysRemaining > 0) {
      setShowModal(false);
    } else if (subscriptionStatus?.status === 'Pending Verification') {
      setShowModal(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      {children}
      <PaymentVerificationModal
        isOpen={showModal}
        onClose={handleCloseModal}
        subscriptionStatus={subscriptionStatus}
        onPaymentSubmitted={handlePaymentSubmitted}
      />
    </>
  );
}
