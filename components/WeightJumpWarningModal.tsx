'use client';

import type { CSSProperties } from 'react';

const C = {
  primary: '#b1c5ff',
  surfaceContainer: '#1e2026',
  outlineVariant: '#3a3c44',
  onSurface: '#e2e2e8',
  onSurfaceVariant: '#c5c6d2',
};

type Props = {
  exerciseName: string;
  enteredWeight: number;
  historicalBest: number;
  message?: string;
  onReenter: () => void;
  onContinue: () => void;
  onSuppressToday?: () => void;
};

export default function WeightJumpWarningModal({
  exerciseName,
  enteredWeight,
  historicalBest,
  message,
  onReenter,
  onContinue,
  onSuppressToday,
}: Props) {
  const pct =
    historicalBest > 0
      ? Math.round(((enteredWeight - historicalBest) / historicalBest) * 100)
      : 0;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 70, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(8,10,16,0.85)' }} />
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: 560,
        background: C.surfaceContainer,
        borderRadius: '20px 20px 0 0',
        border: `1px solid ${C.outlineVariant}`,
        padding: '20px 20px 24px',
      }}>
        <p style={{ margin: '0 0 10px', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 900, fontSize: 18, color: C.onSurface }}>
          Weight Advisory
        </p>
        {historicalBest > 0 && (
          <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.6, color: C.onSurfaceVariant }}>
            {enteredWeight} kg on {exerciseName} is about {pct}% above your recent working weight of {historicalBest} kg.
          </p>
        )}
        <p style={{ margin: '0 0 18px', fontSize: 13, lineHeight: 1.6, color: C.onSurfaceVariant }}>
          {message ??
            'This is much higher than your recent working weights for this exercise. Mistyped?'}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button type="button" onClick={onReenter} style={btnStyle(true)}>Re-enter Weight</button>
          <button type="button" onClick={onContinue} style={btnStyle(false)}>Log Set Anyway</button>
          {onSuppressToday && (
            <button
              type="button"
              onClick={onSuppressToday}
              style={{
                width: '100%',
                padding: '12px 0',
                borderRadius: 12,
                border: `1px solid ${C.outlineVariant}`,
                background: 'transparent',
                color: C.onSurfaceVariant,
                fontFamily: 'Manrope, sans-serif',
                fontWeight: 700,
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              Don&apos;t warn me for this exercise today
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function btnStyle(primary: boolean): CSSProperties {
  return {
    width: '100%',
    padding: '13px 0',
    borderRadius: 12,
    border: primary ? 'none' : `1px solid ${C.outlineVariant}`,
    background: primary ? C.primary : 'transparent',
    color: primary ? '#05080f' : C.onSurfaceVariant,
    fontFamily: 'Manrope, sans-serif',
    fontWeight: 700,
    fontSize: 13,
    cursor: 'pointer',
  };
}
