'use client';

import { useAuth, useUser, UserButton } from '@clerk/nextjs';
import Link from 'next/link';

export default function NavBar({ title }) {
  const { isSignedIn } = useAuth();
  const { user } = useUser();

  if (!isSignedIn) return null;

  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar-content">
          <div>
            <h1 style={{ margin: '0', fontSize: '20px' }}>
              <Link href="/" style={{ textDecoration: 'none', color: '#0066cc' }}>
                SkillBridge
              </Link>
            </h1>
            {title && <p style={{ margin: '4px 0 0 0', color: '#666', fontSize: '14px' }}>{title}</p>}
          </div>
          <div className="navbar-actions">
            <div style={{ color: '#666', fontSize: '14px' }}>
              {user?.firstName} {user?.lastName}
            </div>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </div>
    </nav>
  );
}
