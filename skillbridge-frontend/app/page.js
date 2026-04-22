'use client';

import { useAuth, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const { isSignedIn } = useAuth();
  const { user, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      router.push('/sign-in');
      return;
    }

    // Check if user has role in Clerk publicMetadata
    const userRole = user?.publicMetadata?.role;

    if (!userRole) {
      // No role yet → send to onboarding
      router.push('/onboard');
      return;
    }

    // Map role to dashboard
    const roleRoutes = {
      student: '/dashboard/student',
      trainer: '/dashboard/trainer',
      institution: '/dashboard/institution',
      programme_manager: '/dashboard/manager',
      monitoring_officer: '/dashboard/officer',
    };

    router.push(roleRoutes[userRole] || '/dashboard/student');
  }, [isLoaded, isSignedIn, user, router]);

  return (
    <div style={{ padding: 40 }}>
      Loading...
    </div>
  );
}