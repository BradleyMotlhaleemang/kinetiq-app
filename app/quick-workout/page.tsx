'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Play } from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import { workoutsApi } from '@/lib/api/workouts';
import { ApiError } from '@/lib/api/client';
import { TYPE } from '@/lib/design/typography';

const C = {
  primary: '#b1c5ff',
  tertiary: '#59d8de',
  surface: '#111318',
  surfaceContainer: '#1e2026',
  outline: '#8e909c',
  outlineVariant: '#3a3c44',
  onSurface: '#e2e2e8',
  onSurfaceVariant: '#c5c6d2',
  buttonText: '#05080f',
};

export default function QuickWorkoutPage() {
  const router = useRouter();
  const [starting, setStarting] = useState(false);

  async function handleStart() {
    if (starting) return;
    setStarting(true);
    try {
      const res = await workoutsApi.create({});
      const id = (res.data as { id?: string })?.id;
      if (!id) throw new Error('No workout id returned');
      router.push(`/workout/${id}`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return;
      console.error('Failed to start quick workout', err);
      alert('Failed to start workout');
    } finally {
      setStarting(false);
    }
  }

  return (
    <div style={{ minHeight: '100dvh', backgroundColor: C.surface, paddingBottom: 110 }}>
      <AppHeader showBack backHref="/dashboard" />

      <main
        style={{
          maxWidth: 600,
          margin: '0 auto',
          padding: '24px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
        }}
      >
        <section
          style={{
            background: C.surfaceContainer,
            border: `1px solid ${C.outlineVariant}`,
            borderLeft: `3px solid ${C.tertiary}`,
            borderRadius: 8,
            padding: 20,
          }}
        >
          <span style={{ ...TYPE.labelCaps, color: C.tertiary, display: 'block', marginBottom: 8 }}>
            Quick Workout
          </span>
          <h1 style={{ ...TYPE.headlineMd, color: C.onSurface, margin: '0 0 12px' }}>
            Train outside your block
          </h1>
          <p style={{ ...TYPE.bodyMd, color: C.onSurfaceVariant, margin: 0, lineHeight: 1.6 }}>
            Start an empty session and add any exercises you want. This workout is not part of your
            training block — sets, PRs, and history are still recorded.
          </p>
        </section>

        <button
          type="button"
          onClick={handleStart}
          disabled={starting}
          style={{
            width: '100%',
            padding: '16px 0',
            borderRadius: 8,
            border: 'none',
            background: `linear-gradient(135deg, ${C.primary} 0%, #3a5cbf 100%)`,
            color: C.buttonText,
            ...TYPE.titleCta,
            textTransform: 'uppercase',
            cursor: starting ? 'not-allowed' : 'pointer',
            opacity: starting ? 0.7 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            boxShadow: '0 4px 16px rgba(58,92,191,0.35)',
          }}
        >
          <Play size={20} fill={C.buttonText} color={C.buttonText} />
          {starting ? 'Starting...' : 'Start Empty Workout'}
        </button>

        <p style={{ ...TYPE.labelMeta, color: C.outline, margin: 0, textAlign: 'center' }}>
          No program structure or volume targets — just log and go.
        </p>
      </main>
    </div>
  );
}
