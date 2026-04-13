export default function KinetiqLogo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const scale = size === 'sm' ? 0.7 : size === 'lg' ? 1.4 : 1;
  const fontSize = 22 * scale;

  return (
    <span
      style={{
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: `${fontSize}px`,
        fontWeight: 700,
        letterSpacing: '-0.04em',
        color: '#b1c5ff',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0px',
      }}
    >
      <span style={{ fontStyle: 'italic' }}>KINETI</span>
      <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
        <span style={{ fontStyle: 'italic' }}>Q</span>
        {/* Motion line — the signature dynamic detail */}
        <svg
          width={`${12 * scale}`}
          height={`${8 * scale}`}
          viewBox="0 0 12 8"
          style={{ marginLeft: `${2 * scale}px`, marginBottom: `${2 * scale}px` }}
        >
          <line x1="0" y1="4" x2="10" y2="4" stroke="#59d8de" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="7" y1="1" x2="10" y2="4" stroke="#59d8de" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="7" y1="7" x2="10" y2="4" stroke="#59d8de" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </span>
    </span>
  );
}