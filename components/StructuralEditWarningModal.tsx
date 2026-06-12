'use client';

const C = {
  primary: '#b1c5ff',
  surfaceContainer: '#1e2026',
  outlineVariant: '#3a3c44',
  onSurface: '#e2e2e8',
  onSurfaceVariant: '#c5c6d2',
};

type Props = {
  onKeep: () => void;
  onNewFromProgress: () => void;
  onForceEdit: () => void;
};

export default function StructuralEditWarningModal({ onKeep, onNewFromProgress, onForceEdit }: Props) {
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
          Structural program change
        </p>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.6, color: C.onSurfaceVariant }}>
          This mesocycle is already in progress. Changing training frequency may affect planned volume, recovery, and progression.
        </p>
        <p style={{ margin: '0 0 18px', fontSize: 13, lineHeight: 1.6, color: C.onSurfaceVariant }}>
          We recommend completing the current mesocycle and applying changes to your next training block.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button type="button" onClick={onKeep} style={btnStyle(true)}>Keep Current Mesocycle</button>
          <button type="button" onClick={onNewFromProgress} style={btnStyle(false)}>Create New Mesocycle Based on Current Progress</button>
          <button type="button" onClick={onForceEdit} style={btnStyle(false)}>Force Edit Current Mesocycle (Advanced)</button>
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
