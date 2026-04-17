'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Dumbbell, Layers, LayoutGrid, BookOpen, MoreHorizontal } from 'lucide-react';

const NAV_ITEMS = [
  {
    label: 'Workout',
    href: '/dashboard',
    icon: Dumbbell,
    matchPrefixes: ['/dashboard', '/workout', '/readiness'],
  },
  {
    label: 'Mesocycles',
    href: '/mesocycles',
    icon: Layers,
    matchPrefixes: ['/mesocycles'],
  },
  {
    label: 'Templates',
    href: '/templates',
    icon: LayoutGrid,
    matchPrefixes: ['/templates'],
  },
  {
    label: 'Exercises',
    href: '/exercises',
    icon: BookOpen,
    matchPrefixes: ['/exercises'],
  },
  {
    label: 'More',
    href: '/more',
    icon: MoreHorizontal,
    matchPrefixes: ['/more', '/analytics', '/history', '/profile', '/notifications'],
  },
];

const HIDE_ON_PREFIXES = [
  '/welcome',
  '/how-it-works',
  '/auth/',
  '/onboarding',
  '/weekly-feedback',
  '/workout/',
  '/biofeedback',
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  const shouldHide = HIDE_ON_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );

  if (shouldHide) return null;

  function isActive(item: typeof NAV_ITEMS[0]): boolean {
    return item.matchPrefixes.some((prefix) => pathname.startsWith(prefix));
  }

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        backgroundColor: 'rgba(17,19,24,0.92)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderTop: '1px solid rgba(68,70,80,0.2)',
        height: '72px',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          width: '100%',
          maxWidth: '480px',
          margin: '0 auto',
          padding: '0 8px',
        }}
      >
        {NAV_ITEMS.map((item) => {
          const active = isActive(item);
          const Icon = item.icon;

          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                padding: '8px 12px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                flex: 1,
                transition: 'all 0.15s ease',
                transform: active ? 'scale(1.05)' : 'scale(1)',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: active ? '10px' : '8px',
                  backgroundColor: active ? 'rgba(177,197,255,0.12)' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease',
                }}
              >
                <Icon
                  size={20}
                  color={active ? '#b1c5ff' : '#444650'}
                  strokeWidth={active ? 2 : 1.5}
                />
              </div>
              <span
                style={{
                  fontFamily: 'Manrope, sans-serif',
                  fontSize: '9px',
                  fontWeight: active ? 700 : 500,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: active ? '#b1c5ff' : '#444650',
                  transition: 'color 0.15s ease',
                }}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
