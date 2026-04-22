'use client';

import { useAuth, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

const ROLES = [
  { value: 'student', label: 'Student', description: 'Attend sessions and mark attendance' },
  { value: 'trainer', label: 'Trainer', description: 'Create and manage sessions' },
  { value: 'institution', label: 'Institution', description: 'Manage trainers and batches' },
  { value: 'programme_manager', label: 'Programme Manager', description: 'Oversee all institutions' },
  { value: 'monitoring_officer', label: 'Monitoring Officer', description: 'Read-only monitoring access' },
];

export default function OnboardingPage() {
  const { isSignedIn } = useAuth();
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const [selectedRole, setSelectedRole] = useState('student');
  const [loading, setLoading] = useState(false);

  // Redirect if not signed in
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in');
    }
  }, [isLoaded, isSignedIn, router]);

  const handleContinue = async () => {
    if (!selectedRole) {
      toast.error('Please select a role');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        clerkUserId: user.id,
        name: `${user.firstName || ''} ${user.lastName || ''}`,
        email: user.emailAddresses[0]?.emailAddress,
        role: selectedRole,
      };

      console.log('Onboarding payload:', payload);

      let backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001/api';
      if (backendUrl && !backendUrl.endsWith('/api') && !backendUrl.includes('localhost')) {
        // Auto-correct missing /api for production URLs
        backendUrl = `${backendUrl.replace(/\/$/, '')}/api`;
      }

      // ✅ Save user in backend
      const res = await fetch(`${backendUrl}/users/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      console.log('Backend response:', res.status, data);

      if (res.ok || data.success) {
        toast.success('Account setup complete!');

        const routes = {
          student: '/dashboard/student',
          trainer: '/dashboard/trainer',
          institution: '/dashboard/institution',
          programme_manager: '/dashboard/manager',
          monitoring_officer: '/dashboard/officer',
        };

        const nextRoute = routes[selectedRole];

        console.log('FORCE redirect →', nextRoute);

        // ✅ FINAL FIX: force redirect (works 100%)
        window.location.href = nextRoute;
      } else {
        toast.error(
          data?.error
            ? `${data.error} ${data.details || ''}`
            : `Failed to setup account (${res.status})`
        );
      }
    } catch (error) {
      console.error('Onboarding error:', error);
      toast.error('An error occurred during setup: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) {
    return <div style={{ padding: 40 }}>Loading...</div>;
  }

  return (
    <div style={{ maxWidth: 600, margin: '40px auto' }}>
      <h2>Select Your Role</h2>
      <p style={{ color: '#666' }}>Choose a role to get started</p>

      {ROLES.map((role) => (
        <div
          key={role.value}
          onClick={() => setSelectedRole(role.value)}
          style={{
            border:
              selectedRole === role.value
                ? '2px solid blue'
                : '2px solid #ddd',
            padding: 16,
            marginBottom: 10,
            borderRadius: 8,
            cursor: 'pointer',
          }}
        >
          <input
            type="radio"
            checked={selectedRole === role.value}
            readOnly
          />
          <strong style={{ marginLeft: 10 }}>{role.label}</strong>
          <p style={{ marginLeft: 24, fontSize: 13 }}>{role.description}</p>
        </div>
      ))}

      <button
        onClick={handleContinue}
        disabled={loading}
        style={{
          width: '100%',
          padding: 12,
          marginTop: 20,
          background: '#0066cc',
          color: '#fff',
          border: 'none',
          borderRadius: 6,
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? 'Setting up...' : 'Continue'}
      </button>
    </div>
  );
}