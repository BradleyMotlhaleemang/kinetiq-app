'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/auth';

const C = {
  primary: '#b1c5ff',
  tertiary: '#59d8de',
  surface: '#111318',
  surfaceLow: '#161820',
  outline: '#8e909c',
  outlineVariant: '#3a3c44',
  onSurface: '#e2e2e8',
  onSurfaceVariant: '#c5c6d2',
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

function inputStyle(focused: boolean): React.CSSProperties {
  return {
    width: '100%',
    boxSizing: 'border-box',
    background: C.surfaceLow,
    border: `1px solid ${focused ? C.primary : C.outlineVariant}`,
    borderRadius: 12,
    padding: '14px 16px',
    color: C.onSurface,
    fontFamily: 'Manrope, sans-serif',
    fontSize: 13,
    fontWeight: 500,
    outline: 'none',
    transition: 'border-color 0.18s',
  };
}

const primaryBtnStyle: React.CSSProperties = {
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
};

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.forgotPassword(email.trim().toLowerCase());
    } catch {
      // always show success
    } finally {
      setLoading(false);
      setSubmitted(true);
    }
  }

  return (
    <div style={{
      minHeight: '100dvh',
      backgroundColor: C.surface,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      backgroundImage: 'radial-gradient(circle at 70% 20%, rgba(0,37,96,0.25) 0%, transparent 60%)',
    }}>
      <div style={{ width: '100%', maxWidth: 360 }}>
        <button
          onClick={() => router.push('/auth/login')}
          style={{
            fontFamily: 'Manrope, sans-serif',
            fontSize: 12,
            fontWeight: 700,
            color: C.outline,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            marginBottom: 32,
            display: 'block',
            padding: 0,
          }}
        >
          ← Back to sign in
        </button>

        <div style={{ marginBottom: 48, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 900, fontSize: 20, letterSpacing: '-0.04em' }}>
            <span style={{ background: 'linear-gradient(90deg, #b1c5ff, #d4bbff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Kineti
            </span>
            <span style={{ color: C.tertiary }}>q</span>
          </span>
          <p style={{ ...labelStyle, marginBottom: 0 }}>Elite Performance Labs</p>
        </div>

        {submitted ? (
          <div>
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
            <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: 13, color: C.outline, lineHeight: 1.7 }}>
              If that email is registered, you will receive a reset link shortly.
            </p>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 32 }}>
              <h1 style={{
                fontFamily: 'Space Grotesk, sans-serif',
                fontSize: 'clamp(1.85rem, 6vw, 2.4rem)',
                fontWeight: 900,
                letterSpacing: '-0.04em',
                color: C.onSurface,
                marginBottom: 8,
              }}>
                Forgot password?
              </h1>
              <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: 13, color: C.outline }}>
                Enter your email and we will send you a reset link.
              </p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div>
                <label style={labelStyle}>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setInputFocused(true)}
                  onBlur={() => setInputFocused(false)}
                  style={inputStyle(inputFocused)}
                  placeholder="you@example.com"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                style={{
                  ...primaryBtnStyle,
                  opacity: loading ? 0.7 : 1,
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? 'Sending...' : 'Send reset link'}
              </button>
            </form>
          </>
        )}
      </div>

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
