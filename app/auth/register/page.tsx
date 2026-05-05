'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/auth';
import { useAuthStore } from '@/store/auth.store';

export default function RegisterPage() {
  const router = useRouter();
  const { setTokens, enableDevBypass } = useAuthStore();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await authApi.register(email, password, displayName);
      setTokens(res.data.accessToken, res.data.refreshToken);
      router.push('/onboarding');
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
    <div style={{ minHeight: '100dvh', backgroundColor: '#0c0e12', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', backgroundImage: 'radial-gradient(circle at 70% 20%, rgba(0,37,96,0.25) 0%, transparent 60%)' }}>
      <div style={{ width: '100%', maxWidth: '360px' }}>
        <div style={{ marginBottom: '48px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', gap: '2px', fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.04em', fontFamily: "'Space Grotesk'" }}>
            <span style={{ color: '#b1c5ff' }}>K</span>
            <span style={{ color: '#b1c5ff' }}>I</span>
            <span style={{ color: '#b1c5ff' }}>N</span>
            <span style={{ color: '#b1c5ff' }}>E</span>
            <span style={{ color: '#b1c5ff' }}>T</span>
            <span style={{ color: '#b1c5ff' }}>I</span>
            <span style={{ color: '#59d8de' }}>Q</span>
          </div>
          <p className="label-sm" style={{ color: '#444650' }}>Elite Performance Labs</p>
        </div>

        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontFamily: "'Space Grotesk'", fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.04em', color: '#e2e2e8', marginBottom: '8px' }}>
            Create account.
          </h1>
          <p style={{ fontFamily: 'Manrope', fontSize: '0.875rem', color: '#8e909c' }}>
            Start your adaptive hypertrophy journey.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <label className="label-sm" style={{ color: '#444650', display: 'block', marginBottom: '8px' }}>Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="k-input"
              placeholder="Your name"
              required
            />
          </div>

          <div>
            <label className="label-sm" style={{ color: '#444650', display: 'block', marginBottom: '8px' }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="k-input"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="label-sm" style={{ color: '#444650', display: 'block', marginBottom: '8px' }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="k-input"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <p style={{ fontFamily: 'Manrope', fontSize: '0.75rem', color: '#ffb4ab' }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ marginTop: '8px', color: '#002c70' }}
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={handleDevBypass}
            style={{ marginTop: '8px' }}
          >
            Continue in Demo Mode
          </button>
        </form>

        <p style={{ fontFamily: 'Manrope', fontSize: '0.75rem', color: '#444650', marginTop: '32px', textAlign: 'center' }}>
          Already have an account?{' '}
          <a href="/auth/login" style={{ color: '#b1c5ff', textDecoration: 'none' }}>
            Sign In
          </a>
        </p>
      </div>

      <div style={{ position: 'fixed', bottom: 0, left: 0, width: '600px', height: '600px', background: 'rgba(0,37,96,0.08)', filter: 'blur(120px)', borderRadius: '50%', transform: 'translate(-30%, 30%)', pointerEvents: 'none' }} />
    </div>
  );
}
