'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import AppHeader from '@/components/AppHeader';
import api, { ApiError } from '@/lib/api/client';

const MUSCLES = [
  'CHEST', 'BACK', 'QUADS', 'HAMSTRINGS', 'GLUTES',
  'FRONT_DELT', 'SIDE_DELT', 'REAR_DELT',
  'BICEPS', 'TRICEPS', 'CALVES', 'ABS',
];

const MUSCLE_LABELS: Record<string, string> = {
  CHEST: 'Chest', BACK: 'Back', QUADS: 'Quads',
  HAMSTRINGS: 'Hamstrings', GLUTES: 'Glutes',
  FRONT_DELT: 'Front Delt', SIDE_DELT: 'Side Delt', REAR_DELT: 'Rear Delt',
  BICEPS: 'Biceps', TRICEPS: 'Triceps', CALVES: 'Calves', ABS: 'Abs',
};

const JOINT_PAIN_OPTIONS = [
  { label: 'None', value: 'NONE' },
  { label: 'A little', value: 'LOW' },
  { label: 'Moderate', value: 'MODERATE' },
  { label: 'A lot', value: 'HIGH' },
];

const SORENESS_OPTIONS = [
  { label: 'Not sore', value: 'NEVER_SORE' },
  { label: 'Recovered long ago', value: 'HEALED_LONG_AGO' },
  { label: 'Recovered just in time', value: 'HEALED_ON_TIME' },
  { label: 'Still feeling it', value: 'STILL_SORE' },
];

const PUMP_OPTIONS = [
  { label: 'Low', value: 'LOW' },
  { label: 'Moderate', value: 'MODERATE' },
  { label: 'Amazing', value: 'AMAZING' },
];

const VOLUME_OPTIONS = [
  { label: 'Not enough', value: 'NOT_ENOUGH' },
  { label: 'Just right', value: 'JUST_RIGHT' },
  { label: 'Pushed limits', value: 'PUSHED_LIMITS' },
  { label: 'Too much', value: 'TOO_MUCH' },
];

interface MuscleFeedback {
  muscleGroup: string;
  jointPain: string;
  soreness: string;
  pump: string;
  volume: string;
}

function OptionRow({
  options, selected, onChange,
}: {
  options: { label: string; value: string }[];
  selected: string;
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          style={{
            padding: '8px 14px',
            borderRadius: '9999px',
            fontFamily: 'Manrope', fontSize: '0.75rem', fontWeight: 600,
            letterSpacing: '0.03em',
            border: 'none', cursor: 'pointer',
            backgroundColor: selected === o.value ? '#b1c5ff' : '#1a1c20',
            color: selected === o.value ? '#002c70' : '#8e909c',
            transition: 'all 0.15s ease',
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function MuscleCard({
  muscle, feedback, onChange,
}: {
  muscle: string;
  feedback: MuscleFeedback;
  onChange: (field: keyof MuscleFeedback, value: string) => void;
}) {
  return (
    <div style={{
      backgroundColor: '#1a1c20',
      borderTopRightRadius: '0.75rem',
      borderBottomLeftRadius: '0px',
      borderTopLeftRadius: '0.125rem',
      borderBottomRightRadius: '0.125rem',
      padding: '20px',
      marginBottom: '12px',
    }}>
      <p style={{
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: '1rem', fontWeight: 600,
        letterSpacing: '-0.02em', color: '#e2e2e8',
        marginBottom: '20px',
      }}>
        {MUSCLE_LABELS[muscle]}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <p className="label-sm" style={{ color: '#444650', marginBottom: '8px' }}>Joint pain</p>
          <OptionRow options={JOINT_PAIN_OPTIONS} selected={feedback.jointPain} onChange={(v) => onChange('jointPain', v)} />
        </div>
        <div>
          <p className="label-sm" style={{ color: '#444650', marginBottom: '8px' }}>Soreness</p>
          <OptionRow options={SORENESS_OPTIONS} selected={feedback.soreness} onChange={(v) => onChange('soreness', v)} />
        </div>
        <div>
          <p className="label-sm" style={{ color: '#444650', marginBottom: '8px' }}>Pump</p>
          <OptionRow options={PUMP_OPTIONS} selected={feedback.pump} onChange={(v) => onChange('pump', v)} />
        </div>
        <div>
          <p className="label-sm" style={{ color: '#444650', marginBottom: '8px' }}>Volume</p>
          <OptionRow options={VOLUME_OPTIONS} selected={feedback.volume} onChange={(v) => onChange('volume', v)} />
        </div>
      </div>
    </div>
  );
}

function defaultFeedback(muscle: string): MuscleFeedback {
  return {
    muscleGroup: muscle,
    jointPain: 'NONE',
    soreness: 'HEALED_ON_TIME',
    pump: 'MODERATE',
    volume: 'JUST_RIGHT',
  };
}

function BiofeedbackForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const workoutId = searchParams.get('workoutId') ?? undefined;

  const [activeMuscles, setActiveMuscles] = useState<string[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [feedbacks, setFeedbacks] = useState<Record<string, MuscleFeedback>>({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (workoutId) loadMusclesTrained();
    else setActiveMuscles(MUSCLES.slice(0, 3));
  }, [workoutId]);

  async function loadMusclesTrained() {
    try {
      const res = await api.get(`/api/v1/biofeedback/muscles/${workoutId}`);
      const muscles = res.data.musclesTrainedToday ?? [];
      setActiveMuscles(muscles.length > 0 ? muscles : MUSCLES.slice(0, 3));
    } catch {
      setActiveMuscles(MUSCLES.slice(0, 3));
    }
  }

  function updateFeedback(muscle: string, field: keyof MuscleFeedback, value: string) {
    setFeedbacks((prev) => ({
      ...prev,
      [muscle]: { ...(prev[muscle] ?? defaultFeedback(muscle)), [field]: value },
    }));
  }

  const displayMuscles = showAll ? MUSCLES : activeMuscles;

  async function handleSubmit() {
    setLoading(true);
    try {
      const muscleGroupFeedback = displayMuscles.map((m) => ({
        ...(feedbacks[m] ?? defaultFeedback(m)),
        muscleGroup: m,
      }));

      await api.post('/api/v1/biofeedback', {
        workoutId,
        sorenessLog: Object.fromEntries(
          muscleGroupFeedback.map((m) => [m.muscleGroup,
            m.soreness === 'STILL_SORE' ? 8
            : m.soreness === 'HEALED_ON_TIME' ? 5
            : m.soreness === 'HEALED_LONG_AGO' ? 2 : 0])
        ),
        jointPainLog: Object.fromEntries(
          muscleGroupFeedback.map((m) => [m.muscleGroup,
            m.jointPain === 'HIGH' ? 8
            : m.jointPain === 'MODERATE' ? 5
            : m.jointPain === 'LOW' ? 2 : 0])
        ),
        energyLevel: 7,
        strengthRating: 7,
        muscleFeel: 7,
        sleepLastNight: 7,
        overallWellbeing: 7,
        muscleGroupFeedback,
      });
      setSubmitted(true);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        return;
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center', gap: '16px' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#0a1f10', border: '1px solid #59d8de', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: '#59d8de', fontSize: '24px' }}>✓</span>
        </div>
        <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.03em', color: '#e2e2e8' }}>
          Recovery logged.
        </h2>
        <p style={{ fontFamily: 'Manrope', fontSize: '0.875rem', color: '#8e909c', maxWidth: '280px' }}>
          Your feedback will shape the next session's prescription.
        </p>
        <button onClick={() => router.push('/dashboard')} className="btn-primary" style={{ color: '#002c70', marginTop: '8px', width: '200px' }}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div>
      <p style={{ fontFamily: 'Manrope', fontSize: '0.875rem', color: '#8e909c', marginBottom: '24px', padding: '0 20px' }}>
        Rate each muscle you trained. This data drives your next prescription.
      </p>

      <div style={{ padding: '0 20px' }}>
        {displayMuscles.map((muscle) => (
          <MuscleCard
            key={muscle}
            muscle={muscle}
            feedback={feedbacks[muscle] ?? defaultFeedback(muscle)}
            onChange={(field, value) => updateFeedback(muscle, field, value)}
          />
        ))}

        {!showAll && activeMuscles.length < MUSCLES.length && (
          <button
            onClick={() => setShowAll(true)}
            style={{
              width: '100%', padding: '14px',
              backgroundColor: 'transparent',
              border: '1px solid rgba(68,70,80,0.3)',
              borderRadius: '0.125rem',
              fontFamily: 'Manrope', fontSize: '0.75rem',
              fontWeight: 700, letterSpacing: '0.1em',
              textTransform: 'uppercase', color: '#444650',
              cursor: 'pointer', marginBottom: '16px',
            }}
          >
            Add more muscle groups
          </button>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="btn-primary"
          style={{ color: '#002c70', marginBottom: '32px' }}
        >
          {loading ? 'Saving...' : 'Save feedback'}
        </button>
      </div>
    </div>
  );
}

export default function BiofeedbackPage() {
  return (
    <div style={{ minHeight: '100dvh', backgroundColor: '#111318', paddingBottom: '96px' }}>
      <AppHeader title="Recovery Log" showBack backHref="/dashboard" />
      <Suspense fallback={<p style={{ color: '#8e909c', padding: '20px', fontFamily: 'Manrope' }}>Loading...</p>}>
        <BiofeedbackForm />
      </Suspense>
    </div>
  );
}