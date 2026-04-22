'use client';

import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="page-wrapper">
      <div className="container">
        <div style={{ maxWidth: '400px', margin: '60px auto' }}>
          <h1 style={{ fontSize: '32px', marginBottom: '32px', textAlign: 'center', color: '#0066cc' }}>
            Create Account
          </h1>
          <SignUp
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
