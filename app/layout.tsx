'use client';

import './globals.css';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import SplashScreen from '@/components/SplashScreen';
import BottomNav from '@/components/navigation/BottomNav';

function StoreHydrator() {
  const hydrate = useAuthStore((s) => s.hydrate);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    hydrate();
    if (typeof window !== 'undefined') {
      const seen = sessionStorage.getItem('hasSeenOnboarding');
      if (!seen && pathname === '/') {
        router.replace('/welcome');
      }
    }
  }, [hydrate, pathname, router]);

  return null;
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <html lang="en">
      <body
        style={{
          backgroundColor: '#111318',
          color: '#e2e2e8',
          fontFamily:
            "'Segoe UI', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif",
        }}
      >
        <StoreHydrator />
        {showSplash && (
          <SplashScreen onComplete={() => setShowSplash(false)} />
        )}
        {children}
        <BottomNav />
      </body>
    </html>
  );
}
