'use client';

const C = {
  primary: '#b1c5ff',
  surfaceContainer: '#1e2026',
  outlineVariant: '#3a3c44',
  onSurface: '#e2e2e8',
  onSurfaceVariant: '#c5c6d2',
};

type Props = {
  variant: 'low' | 'high';
  onReenter: () => void;
  onContinue: () => void;
};

export default function RepRangeExceededModal({ variant, onReenter, onContinue }: Props) {
  const bodyCopy =
    variant === 'low'
      ? 'The reps entered are below the typical hypertrophy range (minimum 5 reps per set).'
      : 'The reps entered exceed the typical hypertrophy range (maximum 30 reps per set).';

  const bullets =
    variant === 'low'
      ? ['Incorrect data entry', 'A weight that is too heavy for the target rep range']
      : ['Incorrect data entry', 'A weight that is too light'];

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
          Warning
        </p>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.6, color: C.onSurfaceVariant }}>
          {bodyCopy}
        </p>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.6, color: C.onSurfaceVariant }}>
          This may indicate:
        </p>
        <ul style={{ margin: '0 0 18px', paddingLeft: 18, fontSize: 13, lineHeight: 1.6, color: C.onSurfaceVariant }}>
          {bullets.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p style={{ margin: '0 0 18px', fontSize: 13, lineHeight: 1.6, color: C.onSurfaceVariant }}>
          Would you like to continue?
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button type="button" onClick={onReenter} style={btnStyle(true)}>Re-enter Reps</button>
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
