'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import OnboardingLayout from '@/components/OnboardingLayout';
import StepDots from '@/components/StepDots';
import { ONBOARDING_STEPS } from '@/lib/onboarding-steps';

export default function HowItWorksPage() {
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const touchStart = useRef<number | null>(null);

  const total = ONBOARDING_STEPS.length;
  const step = ONBOARDING_STEPS[current];
  const Icon = step.icon;
  const isLast = current === total - 1;

  function next() {
    if (isLast) {
      sessionStorage.setItem('hasSeenOnboarding', '1');
      router.push('/auth/register');
    } else {
      setCurrent((c) => c + 1);
    }
  }

  function back() {
    if (current > 0) setCurrent((c) => c - 1);
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStart.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStart.current === null) return;
    const delta = touchStart.current - e.changedTouches[0].clientX;
    if (delta > 50) next();
    else if (delta < -50) back();
    touchStart.current = null;
  }

  return (
    <OnboardingLayout skipHref="/auth/register">
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          minHeight: '100dvh', display: 'flex', flexDirection: 'column',
          padding: '80px 24px 48px',
        }}
      >
        {/* Icon */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '0.75rem',
            backgroundColor: '#1a1c20',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '32px',
            border: '1px solid rgba(68,70,80,0.3)',
          }}>
            <Icon size={24} color="#b1c5ff" />
          </div>

          <p className="label-sm" style={{ color: '#444650', marginBottom: '12px' }}>
            Step {current + 1} of {total}
          </p>

          <h2 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: '2rem', fontWeight: 700,
            letterSpacing: '-0.04em', color: '#e2e2e8',
            lineHeight: 1.15, marginBottom: '20px',
          }}>
            {step.title}
          </h2>

          <p style={{
            fontFamily: 'Manrope', fontSize: '0.9rem',
            color: '#8e909c', lineHeight: 1.75,
          }}>
            {step.description}
          </p>
        </div>

        {/* Navigation */}
        <div>
          <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'center' }}>
            <StepDots total={total} current={current} />
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            {current > 0 && (
              <button onClick={back} className="btn-ghost" style={{ flex: 1 }}>
                Back
              </button>
            )}
            <button
              onClick={next}
              className="btn-primary"
              style={{ flex: 1, color: '#002c70' }}
            >
              {isLast ? 'Get started' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </OnboardingLayout>
  );
}