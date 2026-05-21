'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import SplashScreen from '@/components/SplashScreen';

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

export default function ClientShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <>
      <StoreHydrator />
      {showSplash && (
        <SplashScreen onComplete={() => setShowSplash(false)} />
      )}
      {children}
    </>
  );
}
