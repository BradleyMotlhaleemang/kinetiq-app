'use client';

import { useEffect, useState } from 'react';

type SplashPhase = 'logo' | 'text' | 'init' | 'done';

export default function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<SplashPhase>('logo');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('text'), 600);
    const t2 = setTimeout(() => setPhase('init'), 1200);
    const t3 = setTimeout(() => setPhase('done'), 2400);
    const t4 = setTimeout(() => onComplete(), 2800);
    return () => [t1, t2, t3, t4].forEach(clearTimeout);
  }, [onComplete]);

  if (phase === 'done') return null;

  const currentPhase = phase as Exclude<SplashPhase, 'done'>;
  const wordmarkOpacity = currentPhase === 'init' ? 1 : 0;
  const initTextOpacity = currentPhase === 'init' ? 1 : 0;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#0c0e12',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        fontFamily: "'Space Grotesk', sans-serif",
        backgroundImage: 'radial-gradient(circle at center, rgba(0,37,96,0.3) 0%, transparent 70%)',
      }}
    >
      {/* Q Logo */}
      <div
        style={{
          position: 'relative',
          marginBottom: '24px',
          opacity: phase === 'logo' ? 0 : 1,
          transform: phase === 'logo' ? 'scale(0.8)' : 'scale(1)',
          transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        <span
          style={{
            fontSize: '96px',
            fontWeight: 900,
            color: '#b1c5ff',
            lineHeight: 1,
            display: 'block',
            filter: 'drop-shadow(0 0 30px rgba(177,197,255,0.3))',
          }}
        >
          Q
        </span>
        {/* Pulse indicator */}
        <div
          style={{
            position: 'absolute',
            bottom: '-8px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#59d8de' }} />
          <div style={{ position: 'absolute', width: '24px', height: '24px', borderRadius: '50%', border: '1px solid #59d8de', opacity: 0.2 }} />
          <div style={{ position: 'absolute', width: '40px', height: '40px', borderRadius: '50%', border: '1px solid #59d8de', opacity: 0.1 }} />
        </div>
      </div>

      {/* KINETIQ wordmark */}
      <div
        style={{
         
          opacity: wordmarkOpacity,
          transition: 'all 0.4s ease',
        }}
      >
        <h1
          style={{
            fontSize: '32px',
            fontWeight: 700,
            letterSpacing: '0.2em',
            color: '#e2e2e8',
            textTransform: 'uppercase',
            margin: 0,
            textAlign: 'center',
          }}
        >
          KINETIQ
        </h1>
        <p
          style={{
            fontSize: '10px',
            letterSpacing: '0.5em',
            color: '#8e909c',
            textTransform: 'uppercase',
            textAlign: 'center',
            marginTop: '6px',
            fontFamily: "'Manrope', sans-serif",
          }}
        >
          Elite Performance Labs
        </p>
      </div>

      {/* Initializing text */}
      <div
        style={{
          position: 'absolute',
          bottom: '48px',
          opacity: initTextOpacity,
          transition: 'opacity 0.3s ease',
        }}
      >
        <p
          style={{
            fontSize: '10px',
            letterSpacing: '0.3em',
            color: '#444650',
            textTransform: 'uppercase',
            fontFamily: "'Manrope', sans-serif",
          }}
        >
          Initializing Core Systems...
        </p>
      </div>
    </div>
  );
}