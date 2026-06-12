'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { TYPE } from '@/lib/design/typography';

const C = {
  primary: '#b1c5ff',
  surface: '#111318',
  surfaceLow: '#161820',
  surfaceContainer: '#1e2026',
  surfaceHigh: '#282a30',
  outline: '#8e909c',
  outlineVariant: '#3a3c44',
  onSurface: '#e2e2e8',
  onSurfaceVariant: '#c5c6d2',
};

export const MESO_EXPLAINER_STORAGE_KEY = 'kinetiq_seen_meso_explainer';

const EXPLAINER_SECTIONS = [
  {
    title: 'What is a mesocycle?',
    body: 'A mesocycle is a structured training block — one chapter of your training story. You repeat the same weekly split while the app adapts load, reps, and recovery week to week.',
  },
  {
    title: 'Typical duration',
    body: 'Most blocks run 4–12 weeks. Shorter blocks suit skill or peaking phases; longer blocks suit hypertrophy accumulation.',
  },
  {
    title: 'Volume vs intensity phases',
    body: 'Early weeks bias more total sets at moderate effort (volume accumulation). Middle weeks push load and effort (intensification). The final week reduces fatigue before your next block.',
  },
  {
    title: 'Deload purpose',
    body: 'The deload week lowers stress so joints, tendons, and the nervous system recover. You keep training, but with less volume and intensity so the next block starts fresh.',
  },
];

export function MesocycleExplainerContent() {
  return (
    <>
      <h2
        style={{
          margin: '0 0 12px',
          ...TYPE.headlineMd,
          fontWeight: 900,
          fontSize: 19,
          color: C.onSurface,
        }}
      >
        What&apos;s a training block?
      </h2>
      <p
        style={{
          margin: 0,
          ...TYPE.bodyMd,
          lineHeight: 1.65,
          color: C.onSurface,
        }}
      >
        {EXPLAINER_SECTIONS[0].body}
      </p>
    </>
  );
}

export function MesocycleExplainerAccordion() {
  const [open, setOpen] = useState(false);
  return (
    <section style={{ borderTop: `1px solid ${C.outlineVariant}`, paddingTop: 24, marginTop: 8 }}>
      <div
        style={{
          background: C.surfaceLow,
          border: `1px solid rgba(58,60,68,0.3)`,
          borderRadius: 8,
          overflow: 'hidden',
        }}
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 16,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: C.onSurface,
            textAlign: 'left',
          }}
        >
          <span
            style={{
              ...TYPE.bodyLg,
              fontWeight: 700,
            }}
          >
            What is a mesocycle?
          </span>
          <ChevronDown
            size={20}
            style={{
              flexShrink: 0,
              color: C.onSurfaceVariant,
              transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s ease',
            }}
          />
        </button>
        {open && (
          <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {EXPLAINER_SECTIONS.map((section) => (
              <div key={section.title}>
                <p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 800, color: C.onSurface }}>{section.title}</p>
                <p style={{ margin: 0, fontSize: 12, lineHeight: 1.6, color: C.onSurfaceVariant }}>{section.body}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export function MesocycleExplainerInline({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div
      style={{
        background: C.surfaceLow,
        border: `1px solid ${C.outlineVariant}`,
        borderRadius: 14,
        padding: '18px 20px',
        marginBottom: 22,
      }}
    >
      <MesocycleExplainerContent />
      <button
        type="button"
        onClick={onDismiss}
        style={{
          marginTop: 16,
          width: '100%',
          padding: '13px 0',
          borderRadius: 12,
          border: 'none',
          background: `linear-gradient(135deg, ${C.primary} 0%, #3a5cbf 100%)`,
          color: '#05080f',
          ...TYPE.titleCta,
          fontSize: 14,
          cursor: 'pointer',
        }}
      >
        Got it →
      </button>
    </div>
  );
}

export function MesocycleExplainerSheet({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={onDismiss}
    >
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(8,10,16,0.85)', backdropFilter: 'blur(14px)' }} />
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 600,
          background: C.surfaceContainer,
          borderRadius: '20px 20px 0 0',
          maxHeight: '88vh',
          overflowY: 'auto',
          border: `1px solid ${C.outlineVariant}`,
          borderBottom: 'none',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0' }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: C.outlineVariant }} />
        </div>
        <div style={{ padding: '16px 20px 24px' }}>
          <MesocycleExplainerContent />
          <button
            type="button"
            onClick={onDismiss}
            style={{
              marginTop: 20,
              width: '100%',
              padding: '15px 0',
              borderRadius: 14,
              border: 'none',
              background: `linear-gradient(135deg, ${C.primary} 0%, #3a5cbf 100%)`,
              color: '#05080f',
              ...TYPE.titleCta,
              fontSize: 15,
              cursor: 'pointer',
            }}
          >
            Let&apos;s go →
          </button>
        </div>
      </div>
    </div>
  );
}
