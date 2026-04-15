'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import OnboardingLayout from '@/components/OnboardingLayout';
import StepDots from '@/components/StepDots';
import KinetiqLogo from '@/components/KinetiqLogo';

export default function WelcomePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <OnboardingLayout skipHref="/auth/register">
      {/* Background image */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <Image
          src="/images/welcome-bg.jpg"
          alt=""
          fill
          style={{ objectFit: 'cover', opacity: mounted ? 1 : 0, transition: 'opacity 0.4s ease' }}
          priority
        />
        {/* Gradient overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, #0c0e12 40%, rgba(12,14,18,0.6) 70%, rgba(12,14,18,0.2) 100%)',
        }} />
      </div>

      {/* Content */}
      <div style={{
        position: 'relative', zIndex: 1,
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
        minHeight: '100dvh', padding: '0 24px 48px',
      }}>
        <div style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(12px)',
          transition: 'opacity 0.4s ease, transform 0.4s ease',
        }}>
          <div style={{ marginBottom: '16px' }}>
            <KinetiqLogo size="md" clickable={false} />
          </div>

          <h1 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: '2.5rem', fontWeight: 700,
            letterSpacing: '-0.04em', color: '#e2e2e8',
            lineHeight: 1.1, marginBottom: '16px',
          }}>
            Training that<br />learns from you.
          </h1>

          <p style={{
            fontFamily: 'Manrope', fontSize: '0.9rem',
            color: '#8e909c', lineHeight: 1.7, marginBottom: '8px',
          }}>
            Kinetiq reads your recovery after every session and adjusts your
            next workout automatically — no guessing, no static programs.
          </p>

          <p style={{
            fontFamily: 'Manrope', fontSize: '0.75rem',
            color: '#444650', letterSpacing: '0.05em', marginBottom: '40px',
          }}>
            Elite Performance Labs
          </p>

          {/* Buttons */}
          <div style={{
            display: 'flex', flexDirection: 'column', gap: '12px',
            opacity: mounted ? 1 : 0,
            transition: 'opacity 0.4s ease 0.2s',
          }}>
            <button
              onClick={() => router.push('/how-it-works')}
              className="btn-primary"
              style={{ color: '#002c70' }}
            >
              Let's get started
            </button>
            <button
              onClick={() => router.push('/auth/login')}
              className="btn-ghost"
            >
              Sign in
            </button>
          </div>

          <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'center' }}>
            <StepDots total={3} current={0} />
          </div>
        </div>
      </div>
    </OnboardingLayout>
  );
}