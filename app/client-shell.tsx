'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import SplashScreen from '@/components/SplashScreen';

function AuthInitializer() {
  const initializeAuth = useAuthStore((s) => s.initializeAuth);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    void initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const seen = sessionStorage.getItem('hasSeenOnboarding');
      if (!seen && pathname === '/') {
        router.replace('/welcome');
      }
    }
  }, [pathname, router]);

  return null;
}

export default function ClientShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const authReady = useAuthStore((s) => s.authReady);
  const [showSplash, setShowSplash] = useState(true);
  const appReady = authReady && !showSplash;

  return (
    <>
      <AuthInitializer />
      {showSplash && (
        <SplashScreen onComplete={() => setShowSplash(false)} />
      )}
      {!authReady && !showSplash && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#111318',
          }}
        >
          <p style={{ color: '#8e909c', fontFamily: 'Manrope, sans-serif', fontSize: 13 }}>
            Restoring session…
          </p>
        </div>
      )}
      <div style={{ visibility: appReady ? 'visible' : 'hidden' }}>
        {children}
      </div>
    </>
  );
}
