'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/auth';
import { useAuthStore } from '@/store/auth.store';

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

const ghostBtnStyle: React.CSSProperties = {
  width: '100%',
  padding: '14px 0',
  borderRadius: 12,
  border: `1px solid ${C.outlineVariant}`,
  background: 'transparent',
  color: C.onSurfaceVariant,
  fontFamily: 'Manrope, sans-serif',
  fontWeight: 700,
  fontSize: 13,
  cursor: 'pointer',
};

function getPasswordStrength(pw: string): { label: string; color: string } {
  if (pw.length < 8) return { label: 'Too short', color: '#ff6b6b' };
  const hasLetter = /[a-zA-Z]/.test(pw);
  const hasNumber = /[0-9]/.test(pw);
  const hasMixedCase = /[a-z]/.test(pw) && /[A-Z]/.test(pw);
  if (pw.length >= 12 && hasLetter && hasNumber && hasMixedCase) {
    return { label: 'Strong', color: '#59d8de' };
  }
  if (pw.length >= 8 && hasLetter && hasNumber) {
    return { label: 'OK', color: '#f5c842' };
  }
  return { label: 'Too short', color: '#ff6b6b' };
}

export default function RegisterPage() {
  const router = useRouter();
  const { enableDevBypass } = useAuthStore();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const passwordStrength = password.length > 0 ? getPasswordStrength(password) : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const normalizedEmail = email.trim().toLowerCase();
      await authApi.register(normalizedEmail, password, displayName);
      router.push(`/auth/check-email?email=${encodeURIComponent(normalizedEmail)}`);
    } catch {
      setError('Registration failed — email may already be in use');
    } finally {
      setLoading(false);
    }
  }

  function handleDevBypass() {
    enableDevBypass();
    router.push('/dashboard');
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
        <div style={{ marginBottom: 48, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 900, fontSize: 20, letterSpacing: '-0.04em' }}>
            <span style={{ background: 'linear-gradient(90deg, #b1c5ff, #d4bbff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Kineti
            </span>
            <span style={{ color: C.tertiary }}>q</span>
          </span>
          <p style={{ ...labelStyle, marginBottom: 0 }}>Elite Performance Labs</p>
        </div>

        <div style={{ marginBottom: 32 }}>
          <h1 style={{
            fontFamily: 'Space Grotesk, sans-serif',
            fontSize: 'clamp(1.85rem, 6vw, 2.4rem)',
            fontWeight: 900,
            letterSpacing: '-0.04em',
            color: C.onSurface,
            marginBottom: 8,
          }}>
            Create account.
          </h1>
          <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: 13, color: C.outline }}>
            Start your adaptive hypertrophy journey.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div>
            <label style={labelStyle}>Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              onFocus={() => setFocusedField('displayName')}
              onBlur={() => setFocusedField(null)}
              style={inputStyle(focusedField === 'displayName')}
              placeholder="Your name"
              required
            />
          </div>

          <div>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
              style={inputStyle(focusedField === 'email')}
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label style={labelStyle}>Password</label>
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
            {passwordStrength && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
                <div style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: passwordStrength.color,
                  flexShrink: 0,
                }} />
                <span style={{
                  fontFamily: 'Manrope, sans-serif',
                  fontSize: 12,
                  fontWeight: 500,
                  color: passwordStrength.color,
                }}>
                  {passwordStrength.label}
                </span>
              </div>
            )}
          </div>

          {error && (
            <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: 12, fontWeight: 700, color: '#ff6b6b', margin: 0 }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              ...primaryBtnStyle,
              marginTop: 8,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
          <button
            type="button"
            onClick={handleDevBypass}
            style={ghostBtnStyle}
          >
            Continue in Demo Mode
          </button>
        </form>

        <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: 12, color: C.outline, marginTop: 32, textAlign: 'center' }}>
          Already have an account?{' '}
          <Link href="/auth/login" style={{ color: C.primary, textDecoration: 'none' }}>
            Sign In
          </Link>
        </p>
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
