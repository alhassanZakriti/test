'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function DashboardPage() {
  const router = useRouter();
  const { status } = useSession();

  // Extract language from URL - defaulting to 'en' if not found
  const getLangFromPath = () => {
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      // Check if we're already at a localized path
      const match = pathname.match(/^\/([a-z]{2})\//);
      if (match) return match[1];
    }
    return 'en';
  };

  useEffect(() => {
    // Only redirect if session is checked and user is authenticated
    if (status === 'authenticated') {
      const lang = getLangFromPath();
      router.replace(`/${lang}/dashboard`);
    }
  }, [status, router]);

  // Show nothing - this page should never be visible
  return null;
}
