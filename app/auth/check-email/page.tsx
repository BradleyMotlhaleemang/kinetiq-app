'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

const C = {
  primary: '#b1c5ff',
  tertiary: '#59d8de',
  surface: '#111318',
  outline: '#8e909c',
  onSurface: '#e2e2e8',
};

const labelStyle: React.CSSProperties = {
  fontFamily: 'Manrope, sans-serif',
  fontSize: '0.57rem',
  fontWeight: 700,
  letterSpacing: '0.22em',
  textTransform: 'uppercase',
  color: C.outline,
  display: 'block',
  marginBottom: 8,
};

const primaryBtnStyle: React.CSSProperties = {
  display: 'inline-block',
  width: '100%',
  padding: '14px 0',
  borderRadius: 12,
  border: 'none',
  background: 'linear-gradient(135deg, #b1c5ff 0%, #3a5cbf 100%)',
  color: '#05080f',
  fontFamily: 'Space Grotesk, sans-serif',
  fontWeight: 900,
  fontSize: 14,
  letterSpacing: '0.01em',
  cursor: 'pointer',
  textDecoration: 'none',
  textAlign: 'center',
  boxSizing: 'border-box',
};

function CheckEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') ?? 'your inbox';

  return (
    <div style={{ width: '100%', maxWidth: 360 }}>
      <div style={{ marginBottom: 48, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 900, fontSize: 20, letterSpacing: '-0.04em' }}>
          <span style={{ background: 'linear-gradient(90deg, #b1c5ff, #d4bbff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Kineti
          </span>
          <span style={{ color: C.tertiary }}>q</span>
        </span>
        <p style={{ ...labelStyle, marginBottom: 0 }}>Elite Performance Labs</p>
      </div>

      <h1 style={{
        fontFamily: 'Space Grotesk, sans-serif',
        fontSize: 'clamp(1.85rem, 6vw, 2.4rem)',
        fontWeight: 900,
        letterSpacing: '-0.04em',
        color: C.onSurface,
        marginBottom: 16,
      }}>
        Check your email.
      </h1>
      <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: 13, color: C.outline, lineHeight: 1.7, marginBottom: 24 }}>
        We sent a verification link to <strong style={{ color: C.onSurface }}>{email}</strong>.
        Click the link to verify your account, then sign in.
      </p>
      <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: 12, color: C.outline, marginBottom: 32 }}>
        Didn&apos;t receive it? Check spam or wait a few minutes.
      </p>

      <Link href="/auth/login" style={primaryBtnStyle}>
        Back to sign in
      </Link>
    </div>
  );
}

export default function CheckEmailPage() {
  return (
    <div style={{
      minHeight: '100dvh',
      backgroundColor: C.surface,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      backgroundImage: 'radial-gradient(circle at 70% 20%, rgba(0,37,96,0.25) 0%, transparent 60%)',
    }}>
      <Suspense fallback={<p style={{ color: C.outline, fontFamily: 'Manrope, sans-serif' }}>Loading...</p>}>
        <CheckEmailContent />
      </Suspense>

      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        width: 600,
        height: 600,
        background: 'rgba(0,37,96,0.08)',
        filter: 'blur(120px)',
        borderRadius: '50%',
        transform: 'translate(-30%, 30%)',
        pointerEvents: 'none',
      }} />
    </div>
  );
}
