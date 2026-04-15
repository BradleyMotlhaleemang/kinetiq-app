'use client';

import { Space_Grotesk, Manrope } from 'next/font/google';
import './globals.css';
import { Home, Dumbbell, BarChart2, User, ClipboardList } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import SplashScreen from '@/components/SplashScreen';
import KinetiqLogo from '@/components/KinetiqLogo';

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

const NAV_ITEMS = [
  { href: '/dashboard', icon: Home, label: 'Home' },
  { href: '/readiness', icon: Dumbbell, label: 'Train' },
  { href: '/history', icon: ClipboardList, label: 'History' },
  { href: '/analytics', icon: BarChart2, label: 'Stats' },
  { href: '/profile', icon: User, label: 'Profile' },
];

const HIDE_NAV_ON = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/onboarding',
  '/welcome',
  '/how-it-works',
  '/weekly-feedback',
];

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

function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  if (HIDE_NAV_ON.some((p) => pathname.startsWith(p))) return null;
  if (pathname.startsWith('/workout')) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        backgroundColor: 'rgba(17,19,24,0.85)',
        backdropFilter: 'blur(24px)',
        borderTop: '1px solid rgba(68,70,80,0.15)',
      }}
    >
      <div className="flex items-center justify-around py-3 max-w-lg mx-auto">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          return (
            <button
              key={href}
              onClick={() => router.push(href)}
              className="flex flex-col items-center gap-1 px-4 py-1 transition-all active:scale-90"
              style={{ color: active ? '#b1c5ff' : '#444650' }}
            >
              <Icon size={22} />
              <span style={{
                fontSize: '10px',
                fontFamily: 'var(--font-manrope)',
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <html lang="en">
      <body
        className={`${spaceGrotesk.variable} ${manrope.variable}`}
        style={{ backgroundColor: '#111318', color: '#e2e2e8', fontFamily: 'var(--font-manrope)' }}
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