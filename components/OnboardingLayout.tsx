'use client';

import { useRouter } from 'next/navigation';

interface OnboardingLayoutProps {
  children: React.ReactNode;
  showSkip?: boolean;
  skipHref?: string;
}

export default function OnboardingLayout({
  children,
  showSkip = true,
  skipHref = '/auth/register',
}: OnboardingLayoutProps) {
  const router = useRouter();

  return (
    <div style={{
      minHeight: '100dvh',
      backgroundColor: '#0c0e12',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {showSkip && (
        <button
          onClick={() => router.push(skipHref)}
          style={{
            position: 'absolute', top: '52px', right: '20px', zIndex: 10,
            fontFamily: 'Manrope', fontSize: '0.75rem', fontWeight: 600,
            letterSpacing: '0.08em', textTransform: 'uppercase',
            color: '#444650', background: 'none', border: 'none', cursor: 'pointer',
          }}
        >
          Skip
        </button>
      )}
      {children}
    </div>
  );
}