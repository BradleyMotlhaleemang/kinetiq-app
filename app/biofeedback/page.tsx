'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import BiofeedbackForm from '@/components/biofeedback/BiofeedbackForm';

const C = {
  surface: '#111318',
  onSurface: '#e2e2e8',
  outline: '#8e909c',
};

function BiofeedbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const workoutId = searchParams.get('workoutId') ?? '';

  if (!workoutId) {
    return (
      <p style={{ color: C.outline, fontSize: 13, padding: '0 16px' }}>
        Missing workout. Complete a session first.
      </p>
    );
  }

  return (
    <BiofeedbackForm
      workoutId={workoutId}
      onSuccess={() => router.push('/')}
      onSkip={() => router.push('/')}
    />
  );
}

export default function BiofeedbackPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: C.surface,
        color: C.onSurface,
        paddingBottom: 32,
      }}
    >
      <AppHeader title="Session feedback" showBack />
      <p
        style={{
          margin: '0 0 16px',
          padding: '0 16px',
          color: C.outline,
          fontSize: 12,
        }}
      >
        Joint triage first — most sessions are one tap.
      </p>
      <Suspense
        fallback={
          <p style={{ color: C.outline, fontSize: 12, padding: '0 16px' }}>
            Loading…
          </p>
        }
      >
        <BiofeedbackContent />
      </Suspense>
    </div>
  );
}
