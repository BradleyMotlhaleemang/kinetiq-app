'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }

    setLoading(true);
    try {
      await authApi.resetPassword(token, password);
      setSuccess(true);
    } catch {
      setError('This reset link is invalid or has expired.');
    } finally {
      setLoading(false);
    }
  }

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

      {success ? (
        <div>
          <h1 style={{
            fontFamily: 'Space Grotesk, sans-serif',
            fontSize: 'clamp(1.85rem, 6vw, 2.4rem)',
            fontWeight: 900,
            letterSpacing: '-0.04em',
            color: C.onSurface,
            marginBottom: 16,
          }}>
            Password updated.
          </h1>
          <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: 13, color: C.outline, marginBottom: 32 }}>
            Your password has been changed successfully.
          </p>
          <button
            onClick={() => router.push('/auth/login')}
            style={primaryBtnStyle}
          >
            Sign in
          </button>
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
              Set new password
            </h1>
            <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: 13, color: C.outline }}>
              Choose a strong password of at least 8 characters.
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
              <label style={labelStyle}>New password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                style={inputStyle(focusedField === 'password')}
                placeholder="••••••••"
                required
              />
            </div>
            <div>
              <label style={labelStyle}>Confirm password</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                onFocus={() => setFocusedField('confirm')}
                onBlur={() => setFocusedField(null)}
                style={inputStyle(focusedField === 'confirm')}
                placeholder="••••••••"
                required
              />
            </div>
            {error && (
              <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: 12, fontWeight: 700, color: '#ff6b6b', margin: 0 }}>{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              style={{
                ...primaryBtnStyle,
                opacity: loading ? 0.7 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Updating...' : 'Update password'}
            </button>
          </form>
        </>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
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
        <ResetPasswordForm />
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
