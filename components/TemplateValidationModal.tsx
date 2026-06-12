'use client';

const C = {
  primary: '#b1c5ff',
  surfaceContainer: '#1e2026',
  outlineVariant: '#3a3c44',
  onSurface: '#e2e2e8',
  onSurfaceVariant: '#c5c6d2',
};

type Props = {
  issues: string[];
  onClose: () => void;
};

export default function TemplateValidationModal({ issues, onClose }: Props) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 80, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(8,10,16,0.85)' }} onClick={onClose} />
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
          Complete your program before saving
        </p>
        <p style={{ margin: '0 0 12px', fontSize: 13, lineHeight: 1.6, color: C.onSurfaceVariant }}>
          Fix the following training days, then try again:
        </p>
        <ul style={{ margin: '0 0 18px', paddingLeft: 18, fontSize: 13, lineHeight: 1.6, color: C.onSurfaceVariant }}>
          {issues.map((issue) => (
            <li key={issue}>{issue}</li>
          ))}
        </ul>
        <button type="button" onClick={onClose} style={{
          width: '100%',
          padding: '13px 0',
          borderRadius: 12,
          border: 'none',
          background: `linear-gradient(135deg, ${C.primary} 0%, #3a5cbf 100%)`,
          color: '#05080f',
          fontFamily: 'Manrope, sans-serif',
          fontWeight: 700,
          fontSize: 13,
          cursor: 'pointer',
        }}>
          Got it
        </button>
      </div>
    </div>
  );
}
