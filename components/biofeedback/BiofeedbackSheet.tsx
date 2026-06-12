'use client';

import { useState } from 'react';
import { biofeedbackApi } from '@/lib/api/biofeedback';
import {
  JOINT_TRIAGE_OPTIONS,
  rotatedSessionMetaFields,
  type JointTriage,
} from '@/lib/biofeedback/joint-pain-scale';
import BiofeedbackForm from './BiofeedbackForm';

const C = {
  surface: '#111318',
  onSurface: '#e2e2e8',
  outline: '#8e909c',
  outlineVariant: '#3a3c44',
  primary: '#b1c5ff',
  surfaceLow: '#161820',
};

const SORENESS_SCORE_MAP: Record<string, number> = {
  NEVER_SORE: 0,
  HEALED_LONG_AGO: 2,
  HEALED_ON_TIME: 5,
  STILL_SORE: 8,
};

type BiofeedbackSheetProps = {
  open: boolean;
  workoutId: string;
  onClose: () => void;
  onComplete: () => void;
};

export default function BiofeedbackSheet({
  open,
  workoutId,
  onClose,
  onComplete,
}: BiofeedbackSheetProps) {
  const [phase, setPhase] = useState<'triage' | 'full'>('triage');
  const [selectedTriage, setSelectedTriage] = useState<JointTriage | null>(null);
  const [submittingHealthy, setSubmittingHealthy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function submitHealthyPath() {
    setSubmittingHealthy(true);
    setError(null);
    try {
      const res = await biofeedbackApi.getPrePopulation(workoutId);
      const muscles = res.data.muscles ?? [];
      const sorenessLog = Object.fromEntries(
        muscles.map((m) => [
          m.muscle,
          SORENESS_SCORE_MAP[m.lastSorenessLabel ?? 'HEALED_ON_TIME'] ??
            SORENESS_SCORE_MAP.HEALED_ON_TIME,
        ]),
      );
      const meta = rotatedSessionMetaFields(workoutId);
      await biofeedbackApi.submit({
        workoutId,
        jointTriage: 'HEALTHY',
        sorenessLog,
        muscleGroupFeedback: muscles.map((m) => ({
          muscleGroup: m.muscle,
          soreness: m.lastSorenessLabel ?? 'HEALED_ON_TIME',
          jointComfort: 'FEELS_NORMAL',
          volume: 'JUST_RIGHT',
        })),
        globalJointComfortScore: 0,
        jointComfortLog: {},
        sessionPerformance: 3,
        trainingDrive: meta.showDrive ? 3 : 3,
        effortScore: meta.showEffort ? 2 : undefined,
        pumpScore: meta.showPump ? 3 : 3,
      });
      onComplete();
    } catch {
      setError('Could not save feedback. Open full form to try again.');
      setPhase('full');
      setSelectedTriage('HEALTHY');
    } finally {
      setSubmittingHealthy(false);
    }
  }

  function handleTriagePick(triage: JointTriage) {
    setSelectedTriage(triage);
    if (triage === 'HEALTHY') {
      void submitHealthyPath();
      return;
    }
    setPhase('full');
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        background: 'rgba(5, 8, 15, 0.72)',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          maxHeight: '88vh',
          overflowY: 'auto',
          background: C.surface,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          border: `1px solid ${C.outlineVariant}`,
          padding: '20px 16px 24px',
        }}
      >
        <div
          style={{
            width: 40,
            height: 4,
            borderRadius: 999,
            background: C.outlineVariant,
            margin: '0 auto 16px',
          }}
        />

        {phase === 'triage' ? (
          <>
            <h2
              style={{
                margin: '0 0 4px',
                fontFamily: 'Space Grotesk, sans-serif',
                fontWeight: 900,
                fontSize: 20,
                color: C.onSurface,
                textAlign: 'center',
              }}
            >
              How did your joints feel?
            </h2>
            <p
              style={{
                margin: '0 0 16px',
                textAlign: 'center',
                color: C.outline,
                fontSize: 12,
              }}
            >
              One tap if everything felt fine.
            </p>
            {error && (
              <p
                style={{
                  margin: '0 0 12px',
                  color: '#59d8de',
                  fontSize: 12,
                  textAlign: 'center',
                }}
              >
                {error}
              </p>
            )}
            <div style={{ display: 'grid', gap: 8 }}>
              {JOINT_TRIAGE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  disabled={submittingHealthy}
                  onClick={() => handleTriagePick(option.value)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '14px 12px',
                    borderRadius: 12,
                    border: `1px solid ${C.outlineVariant}`,
                    background: C.surfaceLow,
                    color: C.onSurface,
                    cursor: submittingHealthy ? 'wait' : 'pointer',
                    opacity: submittingHealthy ? 0.7 : 1,
                  }}
                >
                  <span style={{ display: 'block', fontWeight: 800, fontSize: 14 }}>
                    {option.label}
                  </span>
                  <span style={{ display: 'block', fontSize: 11, color: C.outline, marginTop: 4 }}>
                    {option.hint}
                  </span>
                </button>
              ))}
            </div>
            {submittingHealthy && (
              <p style={{ margin: '12px 0 0', textAlign: 'center', color: C.outline, fontSize: 12 }}>
                Saving session…
              </p>
            )}
          </>
        ) : (
          <>
            <h2
              style={{
                margin: '0 0 4px',
                fontFamily: 'Space Grotesk, sans-serif',
                fontWeight: 900,
                fontSize: 20,
                color: C.onSurface,
                textAlign: 'center',
              }}
            >
              Session feedback
            </h2>
            <p
              style={{
                margin: '0 0 16px',
                textAlign: 'center',
                color: C.outline,
                fontSize: 12,
              }}
            >
              Tell us which joints were affected.
            </p>
            <BiofeedbackForm
              workoutId={workoutId}
              compact
              initialJointTriage={selectedTriage}
              hideJointTriage
              onSuccess={onComplete}
              onSkip={onComplete}
            />
          </>
        )}
      </div>
    </div>
  );
}
