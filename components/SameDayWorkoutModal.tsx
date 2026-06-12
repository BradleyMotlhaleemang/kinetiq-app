'use client';

const C = {
  primary: '#b1c5ff',
  surfaceContainer: '#1e2026',
  outlineVariant: '#3a3c44',
  onSurface: '#e2e2e8',
  onSurfaceVariant: '#c5c6d2',
};

type Props = {
  onCancel: () => void;
  onContinue: () => void;
};

export default function SameDayWorkoutModal({ onCancel, onContinue }: Props) {
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
          Recovery Advisory
        </p>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.6, color: C.onSurfaceVariant }}>
          You have already completed a workout today.
        </p>
        <p style={{ margin: '0 0 18px', fontSize: 13, lineHeight: 1.6, color: C.onSurfaceVariant }}>
          Most training programs are designed around one completed workout per day to support recovery and accurate progress tracking.
        </p>
        <p style={{ margin: '0 0 18px', fontSize: 13, lineHeight: 1.6, color: C.onSurfaceVariant }}>
          Would you like to continue anyway?
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button type="button" onClick={onCancel} style={btnStyle(true)}>Cancel</button>
          <button type="button" onClick={onContinue} style={btnStyle(false)}>Continue Anyway</button>
        </div>
      </div>
    </div>
  );
}

function btnStyle(primary: boolean): React.CSSProperties {
  return {
    width: '100%',
    padding: '13px 0',
    borderRadius: 12,
    border: primary ? 'none' : `1px solid ${C.outlineVariant}`,
    background: primary ? `linear-gradient(135deg, ${C.primary} 0%, #3a5cbf 100%)` : 'transparent',
    color: primary ? '#05080f' : C.onSurfaceVariant,
    fontFamily: 'Manrope, sans-serif',
    fontWeight: 700,
    fontSize: 13,
    cursor: 'pointer',
  };
}
