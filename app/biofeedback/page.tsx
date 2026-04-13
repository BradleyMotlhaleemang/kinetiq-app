'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import { biofeedbackApi } from '@/lib/api/biofeedback';
import { workoutsApi } from '@/lib/api/workouts';
import { useAuthStore } from '@/store/auth.store';

const MUSCLE_FIELDS = [
  { key: 'CHEST', label: 'Chest' },
  { key: 'BACK', label: 'Back' },
  { key: 'QUADS', label: 'Quads' },
  { key: 'HAMSTRINGS', label: 'Hamstrings' },
  { key: 'GLUTES', label: 'Glutes' },
  { key: 'SIDE_DELT', label: 'Shoulders' },
  { key: 'BICEPS', label: 'Biceps' },
  { key: 'TRICEPS', label: 'Triceps' },
];

const JOINT_FIELDS = [
  { key: 'SHOULDERS', label: 'Shoulders' },
  { key: 'ELBOWS', label: 'Elbows' },
  { key: 'LOWER_BACK', label: 'Lower back' },
  { key: 'HIPS', label: 'Hips' },
  { key: 'KNEES', label: 'Knees' },
];

const SCALE = [1, 2, 3, 4, 5];

function createInitialMap(fields: Array<{ key: string }>) {
  return fields.reduce<Record<string, number>>((acc, field) => {
    acc[field.key] = 1;
    return acc;
  }, {});
}

export default function BiofeedbackPage() {
  const router = useRouter();
  const { hydrated, isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [latestWorkout, setLatestWorkout] = useState<any>(null);
  const [latestEntry, setLatestEntry] = useState<any>(null);
  const [sorenessLog, setSorenessLog] = useState<Record<string, number>>(
    createInitialMap(MUSCLE_FIELDS),
  );
  const [jointPainLog, setJointPainLog] = useState<Record<string, number>>(
    createInitialMap(JOINT_FIELDS),
  );
  const [recovery, setRecovery] = useState({
    energyLevel: 3,
    strengthRating: 3,
    muscleFeel: 3,
    sleepLastNight: 3,
    overallWellbeing: 3,
  });

  useEffect(() => {
    if (!hydrated) return;
    if (!isAuthenticated()) {
      router.push('/auth/login');
      return;
    }

    void loadContext();
  }, [hydrated, isAuthenticated, router]);

  async function loadContext() {
    setLoading(true);
    setError('');

    try {
      const [historyRes, latestRes] = await Promise.allSettled([
        workoutsApi.history(),
        biofeedbackApi.latest(),
      ]);

      if (historyRes.status === 'fulfilled') {
        setLatestWorkout(historyRes.value.data[0] ?? null);
      }

      if (latestRes.status === 'fulfilled') {
        setLatestEntry(latestRes.value.data ?? null);
      }
    } catch (err) {
      console.error(err);
      setError('Could not load biofeedback context.');
    } finally {
      setLoading(false);
    }
  }

  const hasRecentSubmissionForWorkout = useMemo(() => {
    if (!latestWorkout || !latestEntry?.workoutId) return false;
    return latestWorkout.id === latestEntry.workoutId;
  }, [latestEntry, latestWorkout]);

  async function handleSubmit() {
    setSaving(true);
    setError('');

    try {
      await biofeedbackApi.submit({
        workoutId: latestWorkout?.id,
        sorenessLog,
        jointPainLog,
        ...recovery,
      });
      setSubmitted(true);
    } catch (err: any) {
      console.error(err);
      setError('Could not submit your biofeedback. Please try again.');
    } finally {
      setSaving(false);
    }
  }

function updateScale(
    setter: (value: (current: Record<string, number>) => Record<string, number>) => void,
    key: string,
    value: number,
  ) {
    setter((current) => ({ ...current, [key]: value }));
  }

  function updateRecovery(key: keyof typeof recovery, value: number) {
    setRecovery((current) => ({ ...current, [key]: value }));
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-zinc-400 text-sm">Loading recovery check-in...</p>
      </div>
    );
  }

  if (submitted || hasRecentSubmissionForWorkout) {
    return (
      <div className="min-h-screen bg-black px-4 pt-12 pb-24 flex items-center">
        <div className="max-w-sm mx-auto w-full space-y-6">
          <div className="rounded-2xl border border-emerald-800 bg-emerald-950 p-6 text-center">
            <p className="text-white text-xl font-bold">Recovery logged</p>
            <p className="text-emerald-200 text-sm mt-2">
              {hasRecentSubmissionForWorkout
                ? 'You already submitted biofeedback for your latest session.'
                : 'Thanks. Your recovery data will shape upcoming training decisions.'}
            </p>
          </div>

          <button
            onClick={() => router.push('/dashboard')}
            className="w-full bg-white text-black font-semibold py-4 rounded-xl hover:bg-zinc-200 transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black px-4 pt-12 pb-24">
      <div className="max-w-sm mx-auto space-y-8">
        <AppHeader title="Recovery Log" showBack />
        <p className="text-zinc-400 text-sm">
          Log how your body feels so recovery and progression stay accurate.
        </p>

        {latestWorkout && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <p className="text-zinc-400 text-xs uppercase tracking-wide">Latest session</p>
            <p className="text-white text-sm font-medium mt-2">
              {latestWorkout.splitDayLabel ?? 'Training Session'}
            </p>
            <p className="text-zinc-400 text-xs mt-1">
              {new Date(latestWorkout.completedAt).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        )}

        <section className="space-y-4">
          <div>
            <h2 className="text-white font-medium">Muscle soreness</h2>
            <p className="text-zinc-400 text-xs mt-1">1 = none, 5 = very sore</p>
          </div>
          {MUSCLE_FIELDS.map((field) => (
            <ScaleRow
              key={field.key}
              label={field.label}
              value={sorenessLog[field.key]}
              onChange={(value) => updateScale(setSorenessLog, field.key, value)}
            />
          ))}
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-white font-medium">Joint pain</h2>
            <p className="text-zinc-400 text-xs mt-1">1 = none, 5 = severe</p>
          </div>
          {JOINT_FIELDS.map((field) => (
            <ScaleRow
              key={field.key}
              label={field.label}
              value={jointPainLog[field.key]}
              onChange={(value) => updateScale(setJointPainLog, field.key, value)}
            />
          ))}
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-white font-medium">Overall recovery</h2>
            <p className="text-zinc-400 text-xs mt-1">Rate how you bounced back from the session.</p>
          </div>
          <ScaleRow
            label="Energy"
            value={recovery.energyLevel}
            onChange={(value) => updateRecovery('energyLevel', value)}
          />
          <ScaleRow
            label="Strength"
            value={recovery.strengthRating}
            onChange={(value) => updateRecovery('strengthRating', value)}
          />
          <ScaleRow
            label="Muscle feel"
            value={recovery.muscleFeel}
            onChange={(value) => updateRecovery('muscleFeel', value)}
          />
          <ScaleRow
            label="Sleep"
            value={recovery.sleepLastNight}
            onChange={(value) => updateRecovery('sleepLastNight', value)}
          />
          <ScaleRow
            label="Wellbeing"
            value={recovery.overallWellbeing}
            onChange={(value) => updateRecovery('overallWellbeing', value)}
          />
        </section>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={saving}
          className="w-full bg-white text-black font-semibold py-4 rounded-xl hover:bg-zinc-200 transition disabled:opacity-50"
        >
          {saving ? 'Submitting...' : 'Submit Biofeedback'}
        </button>
      </div>
    </div>
  );
}

function ScaleRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-white text-sm">{label}</p>
        <p className="text-zinc-400 text-xs">{value}/5</p>
      </div>
      <div className="flex gap-2">
        {SCALE.map((item) => (
          <button
            key={item}
            onClick={() => onChange(item)}
            className={`flex-1 py-3 rounded-lg text-sm font-medium transition ${
              value === item
                ? 'bg-white text-black'
                : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
            }`}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}
