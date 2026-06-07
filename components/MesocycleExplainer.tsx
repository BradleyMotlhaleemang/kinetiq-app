'use client';

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

export function MesocycleExplainerContent() {
  return (
    <>
      <h2 style={{
        margin: '0 0 12px',
        fontFamily: 'Space Grotesk, sans-serif',
        fontWeight: 900,
        fontSize: 19,
        letterSpacing: '-0.04em',
        color: C.onSurface,
      }}>
        What&apos;s a training block?
      </h2>
      <p style={{
        margin: 0,
        fontFamily: 'Manrope, sans-serif',
        fontSize: 14,
        lineHeight: 1.65,
        color: C.onSurface,
        fontWeight: 500,
      }}>
        A mesocycle is a training block — typically 4–12 weeks — where you follow a structured plan that gradually increases in difficulty. Think of it as one chapter of your overall training story. Each week follows the same split, but the app adapts your weights and reps as you go, with a lighter deload week at the end. Tracking your progress across a full block is how the app learns your body and makes smarter decisions for your next session.
      </p>
    </>
  );
}

export function MesocycleExplainerInline({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div style={{
      background: C.surfaceLow,
      border: `1px solid ${C.outlineVariant}`,
      borderRadius: 14,
      padding: '18px 20px',
      marginBottom: 22,
    }}>
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
          fontFamily: 'Space Grotesk, sans-serif',
          fontWeight: 900,
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
              fontFamily: 'Space Grotesk, sans-serif',
              fontWeight: 900,
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
