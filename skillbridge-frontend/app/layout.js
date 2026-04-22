  import { ClerkProvider } from '@clerk/nextjs';
  import { Toaster } from 'react-hot-toast';
  import './globals.css';

  export const metadata = {
    title: 'SkillBridge - Attendance Management',
    description: 'Manage attendance across SkillBridge program',
  };

  export default function RootLayout({ children }) {
    return (
      <ClerkProvider>
        <html lang="en">
          <body>
            {children}
            <Toaster position="top-right" />
          </body>
        </html>
      </ClerkProvider>
    );
  }
