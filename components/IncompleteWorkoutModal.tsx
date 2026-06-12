'use client';

const C = {
  primary: '#b1c5ff',
  surfaceContainer: '#1e2026',
  outlineVariant: '#3a3c44',
  onSurface: '#e2e2e8',
  onSurfaceVariant: '#c5c6d2',
};

type IncompleteItem = {
  exerciseName: string;
  completedSets: number;
  targetSets: number;
};

type Props = {
  items: IncompleteItem[];
  onResume: () => void;
  onEndAnyway: () => void;
};

export default function IncompleteWorkoutModal({ items, onResume, onEndAnyway }: Props) {
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
        maxHeight: '70vh',
        overflowY: 'auto',
      }}>
        <p style={{ margin: '0 0 10px', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 900, fontSize: 18, color: C.onSurface }}>
          Incomplete Workout
        </p>
        <p style={{ margin: '0 0 12px', fontSize: 13, lineHeight: 1.6, color: C.onSurfaceVariant }}>
          Some exercises or sets are still incomplete. You can resume logging or end the workout anyway.
        </p>
        <ul style={{ margin: '0 0 18px', paddingLeft: 18, fontSize: 13, lineHeight: 1.6, color: C.onSurfaceVariant }}>
          {items.map((item) => (
            <li key={item.exerciseName}>
              {item.exerciseName} — {item.completedSets} of {item.targetSets} sets logged
            </li>
          ))}
        </ul>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button type="button" onClick={onResume} style={btnStyle(true)}>Resume Workout</button>
          <button type="button" onClick={onEndAnyway} style={btnStyle(false)}>End Workout Anyway</button>
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
