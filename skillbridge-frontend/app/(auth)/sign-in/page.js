'use client';

import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="page-wrapper">
      <div className="container">
        <div style={{ maxWidth: '400px', margin: '80px auto' }}>
          <h1 style={{ fontSize: '32px', marginBottom: '32px', textAlign: 'center', color: '#0066cc' }}>
            Sign In
          </h1>
          <SignIn
            appearance={{
              elements: {
                formButtonPrimary: 'btn-primary',
                card: 'card',
              },
            }}
            routing="hash"
            redirectUrl="/onboard"
          />
        </div>
      </div>
    </div>
  );
}
