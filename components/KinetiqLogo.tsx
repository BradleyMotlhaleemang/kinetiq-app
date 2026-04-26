export default function KinetiqLogo({
  size = 'md',
}: {
  size?: 'sm' | 'md' | 'lg';
  clickable?: boolean;
}) {
  const fontSize = size === 'sm' ? 18 : size === 'lg' ? 24 : 20;
  return (
    <span style={{
      fontFamily: 'Space Grotesk, sans-serif',
      fontWeight: 900,
      fontSize,
      letterSpacing: '-0.04em',
    }}>
      <span style={{
        background: 'linear-gradient(90deg, #b1c5ff, #d4bbff)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }}>
        Kinetiq
      </span>
    </span>
  );
}

// NOTE: The "Q" teal treatment is done by splitting the word:
// "Kinetiq" → "Kinetiق" is NOT split in current templates page.
// To add teal Q: render "Kineti" with the gradient, then "q" in color #59d8de.
// Implementation:
function KinetiqLogoWithTealQ() {
  return (
    <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 900, fontSize: 20, letterSpacing: '-0.04em' }}>
      <span style={{ background: 'linear-gradient(90deg, #b1c5ff, #d4bbff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        Kineti
      </span>
      <span style={{ color: '#59d8de' }}>q</span>
    </span>
  );
}