'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/auth';
import api, { ApiError } from '@/lib/api/client';
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

export default function LoginPage() {
  const router = useRouter();
  const { setAccessToken, setUser } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showResend, setShowResend] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    router.prefetch('/dashboard');
    router.prefetch('/onboarding');
  }, [router]);

  async function handleResendVerification() {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) return;
    setResending(true);
    setResendMessage('');
    try {
      await authApi.resendVerification(normalizedEmail);
      setResendMessage('Verification email sent — check your inbox');
    } catch {
      setResendMessage('Could not resend — try again');
    } finally {
      setResending(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setShowResend(false);
    setResendMessage('');
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const res = await authApi.login(normalizedEmail, password);
      const accessToken = res.data?.accessToken;
      if (!accessToken) {
        setError('Login response was invalid. Check that the API is running.');
        return;
      }
      setAccessToken(accessToken);
      setUser('', normalizedEmail);
      try {
        const meRes = await api.get('/api/v1/users/me');
        const { onboardingCompletedAt, id, email: userEmail } = meRes?.data ?? {};
        if (id && userEmail) setUser(id, userEmail);
        if (!onboardingCompletedAt) {
          router.push('/onboarding');
          return;
        }
      } catch {
        // Keep login resilient: default to dashboard if profile lookup fails.
      }
      router.push('/dashboard');
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 0) {
          setError(err.message);
        } else if (err.code === 'EMAIL_NOT_VERIFIED') {
          setError('Please verify your email before signing in.');
          setShowResend(true);
        } else if (err.code === 'ACCOUNT_LOCKED') {
          setError('Account temporarily locked. Try again later.');
        } else if (err.status === 401) {
          setError('Invalid email or password');
        } else {
          setError(err.message);
        }
      } else {
        setError('Invalid email or password');
      }
    } finally {
      setLoading(false);
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
            Welcome back.
          </h1>
          <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: 13, color: C.outline }}>
            Sign in to continue your training.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
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
          </div>

          <div style={{ textAlign: 'right', marginTop: -16 }}>
            <Link href="/auth/forgot-password" style={{ fontFamily: 'Manrope, sans-serif', fontSize: 12, color: C.outline, textDecoration: 'none' }}>
              Forgot password?
            </Link>
          </div>

          {error && (
            <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: 12, fontWeight: 700, color: '#ff6b6b', margin: 0 }}>{error}</p>
          )}

          {showResend && (
            <button
              type="button"
              onClick={handleResendVerification}
              disabled={resending}
              style={{ ...ghostBtnStyle, opacity: resending ? 0.7 : 1, cursor: resending ? 'not-allowed' : 'pointer' }}
            >
              {resending ? 'Sending...' : 'Resend verification email'}
            </button>
          )}

          {resendMessage && (
            <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: 12, color: C.outline, margin: 0 }}>{resendMessage}</p>
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
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: 12, color: C.outline, marginTop: 32, textAlign: 'center' }}>
          No account?{' '}
          <Link href="/auth/register" style={{ color: C.primary, textDecoration: 'none' }}>
            Create one
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
