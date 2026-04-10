'use client';

import { Home, Dumbbell, BarChart2, User, ClipboardList } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { Inter } from 'next/font/google';
import './globals.css';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';


const inter = Inter({ subsets: ['latin'] });

const NAV_ITEMS = [
  { href: '/dashboard', icon: Home, label: 'Home' },
  { href: '/readiness', icon: Dumbbell, label: 'Train' },
  { href: '/history', icon: ClipboardList, label: 'History' },
  { href: '/analytics', icon: BarChart2, label: 'Stats' },
  { href: '/profile', icon: User, label: 'Profile' },
];

function StoreHydrator() {
  const hydrate = useAuthStore((s) => s.hydrate);
  useEffect(() => {
    hydrate();
  }, [hydrate]);
  return null;
}

const HIDE_NAV_ON = ['/auth/login', '/auth/register', '/onboarding'];

function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  if (HIDE_NAV_ON.some((p) => pathname.startsWith(p))) return null;
  if (pathname.startsWith('/workout')) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-zinc-950 border-t border-zinc-800 z-50">
      <div className="flex items-center justify-around py-3 max-w-lg mx-auto">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          return (
            <button
              key={href}
              onClick={() => router.push(href)}
              className={`flex flex-col items-center gap-1 px-4 py-1 transition ${
                active ? 'text-white' : 'text-zinc-500'
              }`}
            >
              <Icon size={22} />
              <span className="text-xs">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}



export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <body className={inter.className}>
  <StoreHydrator />
  {children}
  <BottomNav />
</body>
        {children}
        <BottomNav />
      </body>
    </html>
  );
}