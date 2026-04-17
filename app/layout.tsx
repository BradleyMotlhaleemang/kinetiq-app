'use client';

import { Space_Grotesk, Manrope } from 'next/font/google';
import './globals.css';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import SplashScreen from '@/components/SplashScreen';
import BottomNav from '@/components/navigation/BottomNav';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  weight: ['300', '400', '500', '600', '700'],
});

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  weight: ['300', '400', '500', '600', '700', '800'],
});

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
        className={`${spaceGrotesk.variable} ${manrope.variable}`}
        style={{
          backgroundColor: '#111318',
          color: '#e2e2e8',
          fontFamily: 'var(--font-manrope)',
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