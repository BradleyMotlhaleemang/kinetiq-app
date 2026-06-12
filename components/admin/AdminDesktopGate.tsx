'use client';

import { useEffect, useState } from 'react';

const MIN_WIDTH = 1024;

export default function AdminDesktopGate({ children }: { children: React.ReactNode }) {
  const [wideEnough, setWideEnough] = useState(true);

  useEffect(() => {
    const check = () => setWideEnough(window.innerWidth >= MIN_WIDTH);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  if (!wideEnough) {
    return (
      <div
        style={{
          minHeight: '100dvh',
          backgroundColor: '#111318',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 32,
        }}
      >
        <div style={{ maxWidth: 400, textAlign: 'center' }}>
          <p
            style={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontWeight: 900,
              fontSize: '1.25rem',
              color: '#e2e2e8',
              margin: '0 0 12px',
            }}
          >
            Desktop required
          </p>
          <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: 14, color: '#8e909c', margin: 0, lineHeight: 1.6 }}>
            Admin portal requires a desktop browser (1024px or wider).
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
