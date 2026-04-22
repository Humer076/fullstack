'use client';

import { useRoleProtection } from '@/lib/auth';
import NavBar from '@/components/NavBar';

export default function DashboardLayout({ children }) {
  const { isLoaded } = useRoleProtection(['student', 'trainer', 'institution', 'programme_manager', 'monitoring_officer']);

  if (!isLoaded) {
    return (
      <div className="page-wrapper">
        <div className="container">
          <div className="loading">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <NavBar />
      <div className="page-wrapper">
        <div className="container">
          {children}
        </div>
      </div>
    </>
  );
}
