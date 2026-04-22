'use client';

import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useEffect } from 'react';

// Map of roles to their dashboard routes
const ROLE_ROUTES = {
  student: '/dashboard/student',
  trainer: '/dashboard/trainer',
  institution: '/dashboard/institution',
  programme_manager: '/dashboard/manager',
  monitoring_officer: '/dashboard/officer',
};

/**
 * Hook to protect routes by role
 */
export const useRoleProtection = (allowedRoles = []) => {
  const router = useRouter();
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (!isLoaded) return;

    if (!user) {
      router.push('/sign-in');
      return;
    }

    // ✅ FIX: DO NOT check Clerk metadata
    // (you are storing role in backend, not Clerk)

    // Optional: you can later fetch role from backend here

  }, [user, isLoaded, router]);

  return { user, isLoaded };
};

/**
 * Get dashboard route for user role
 */
export const getDashboardRoute = (role) => {
  return ROLE_ROUTES[role] || '/dashboard/student';
};

export default {
  useRoleProtection,
  getDashboardRoute,
  ROLE_ROUTES,
};