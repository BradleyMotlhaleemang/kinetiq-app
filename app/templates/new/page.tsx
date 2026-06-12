'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import { templatesApi } from '@/lib/api/templates';
import { ApiError } from '@/lib/api/client';
import {
  WEEKDAYS,
  buildDefaultSchedule,
  countWorkoutDays,
  toggleScheduleDay,
  type ScheduleDay,
} from '@/lib/programs/weekday-schedule';

const C = {
  primary: '#b1c5ff',
  surface: '#111318',
  surfaceLow: '#161820',
  surfaceContainer: '#1e2026',
  outline: '#8e909c',
  outlineVariant: '#3a3c44',
  onSurface: '#e2e2e8',
  onSurfaceVariant: '#c5c6d2',
  tertiary: '#59d8de',
};

const TRAINING_DAY_OPTIONS = [3, 4, 5, 6, 7] as const;

export default function NewTemplateWizardPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [trainingDays, setTrainingDays] = useState<number | null>(null);
  const [schedule, setSchedule] = useState<ScheduleDay[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [scheduleHint, setScheduleHint] = useState<string | null>(null);

  function handleSelectTrainingDays(count: number) {
    setTrainingDays(count);
    setSchedule(buildDefaultSchedule(count));
    setScheduleHint(null);
    setStep(2);
  }

  function handleToggleDay(dayNumber: number) {
    if (trainingDays === null) return;
    const current = schedule.find((d) => d.dayNumber === dayNumber);
    if (current?.dayType === 'REST' && countWorkoutDays(schedule) >= trainingDays) {
      setScheduleHint(`You can only select ${trainingDays} training days.`);
      return;
    }
    setScheduleHint(null);
    setSchedule((prev) => toggleScheduleDay(prev, dayNumber, trainingDays));
  }

  async function handleContinue() {
    if (trainingDays === null || submitting) return;
    if (countWorkoutDays(schedule) !== trainingDays) return;
    setSubmitting(true);
    try {
      const res = await templatesApi.scratch({
        name: 'Custom Program',
        daysPerWeek: trainingDays,
        days: schedule,
      });
      const id = (res.data as { id?: string })?.id;
      if (id) router.push(`/templates/${id}/edit`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return;
      const message = err instanceof ApiError ? err.message : 'Failed to create program';
      alert(message);
    } finally {
      setSubmitting(false);
    }
  }

  const workoutSelected = countWorkoutDays(schedule);
  const scheduleComplete = trainingDays !== null && workoutSelected === trainingDays;

  return (
    <div style={{ minHeight: '100dvh', background: C.surface, paddingBottom: 110 }}>
      <AppHeader title="Create New Program" showBack backHref="/mesocycles" />
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 20px' }}>
        {step === 1 && (
          <>
            <p style={{ margin: '0 0 6px', fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.outline, fontWeight: 700 }}>
              Step 1 of 2
            </p>
            <h1 style={{ margin: '0 0 10px', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 900, fontSize: 22, color: C.onSurface }}>
              How many days per week do you want to train?
            </h1>
            <p style={{ margin: '0 0 24px', fontSize: 13, lineHeight: 1.6, color: C.onSurfaceVariant }}>
              Choose your weekly training frequency. You will pick which days next.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              {TRAINING_DAY_OPTIONS.map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => handleSelectTrainingDays(count)}
                  style={{
                    padding: '18px 0',
                    borderRadius: 12,
                    border: `1px solid ${C.outlineVariant}`,
                    background: C.surfaceLow,
                    color: C.onSurface,
                    fontFamily: 'Space Grotesk, sans-serif',
                    fontWeight: 800,
                    fontSize: 16,
                    cursor: 'pointer',
                  }}
                >
                  {count} Days
                </button>
              ))}
            </div>
          </>
        )}

        {step === 2 && trainingDays !== null && (
          <>
            <p style={{ margin: '0 0 6px', fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.outline, fontWeight: 700 }}>
              Step 2 of 2
            </p>
            <h1 style={{ margin: '0 0 10px', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 900, fontSize: 22, color: C.onSurface }}>
              Choose your weekly schedule
            </h1>
            <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.6, color: C.onSurfaceVariant }}>
              Tap days to set workout or rest. Select exactly {trainingDays} training days.
            </p>
            <p style={{ margin: '0 0 20px', fontSize: 13, fontWeight: 700, color: scheduleComplete ? C.tertiary : C.primary }}>
              {workoutSelected}/{trainingDays} Training Days Selected
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
              gap: 6,
              marginBottom: 12,
            }}>
              {schedule.map((day) => {
                const weekday = WEEKDAYS[day.dayNumber - 1] ?? day.label;
                const isWorkout = day.dayType === 'WORKOUT';
                const atMax = !isWorkout && workoutSelected >= trainingDays;
                return (
                  <button
                    key={day.dayNumber}
                    type="button"
                    onClick={() => handleToggleDay(day.dayNumber)}
                    disabled={atMax}
                    style={{
                      padding: '10px 4px',
                      borderRadius: 10,
                      border: `1px solid ${isWorkout ? C.primary : C.outlineVariant}`,
                      background: isWorkout ? 'rgba(177,197,255,0.12)' : C.surfaceLow,
                      color: isWorkout ? C.primary : C.onSurfaceVariant,
                      cursor: atMax ? 'not-allowed' : 'pointer',
                      opacity: atMax ? 0.5 : 1,
                      textAlign: 'center',
                      minWidth: 0,
                    }}
                  >
                    <span style={{ display: 'block', fontSize: 10, fontWeight: 800 }}>{weekday.slice(0, 1)}</span>
                    <span style={{ display: 'block', fontSize: 9, marginTop: 4, fontWeight: 600, lineHeight: 1.2 }}>
                      {isWorkout ? 'Train' : 'Rest'}
                    </span>
                  </button>
                );
              })}
            </div>

            {scheduleHint && (
              <p style={{ margin: '0 0 16px', fontSize: 12, color: C.onSurfaceVariant }}>{scheduleHint}</p>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                type="button"
                onClick={() => setStep(1)}
                style={{
                  width: '100%',
                  padding: '13px 0',
                  borderRadius: 12,
                  border: `1px solid ${C.outlineVariant}`,
                  background: 'transparent',
                  color: C.onSurfaceVariant,
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Back
              </button>
              <button
                type="button"
                disabled={!scheduleComplete || submitting}
                onClick={handleContinue}
                style={{
                  width: '100%',
                  padding: '13px 0',
                  borderRadius: 12,
                  border: 'none',
                  background: scheduleComplete ? `linear-gradient(135deg, ${C.primary} 0%, #3a5cbf 100%)` : C.surfaceContainer,
                  color: scheduleComplete ? '#05080f' : C.outline,
                  fontFamily: 'Space Grotesk, sans-serif',
                  fontWeight: 900,
                  fontSize: 13,
                  cursor: scheduleComplete && !submitting ? 'pointer' : 'not-allowed',
                  opacity: submitting ? 0.7 : 1,
                }}
              >
                {submitting ? 'Creating…' : 'Continue to program builder →'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
