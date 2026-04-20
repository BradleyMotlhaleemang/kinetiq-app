'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api/client';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }

    setLoading(true);
    try {
      await api.post('/api/v1/auth/reset-password', { token, newPassword: password });
      setSuccess(true);
    } catch {
      setError('This reset link is invalid or has expired.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ width: '100%', maxWidth: '360px' }}>
      <div style={{ display: 'flex', gap: '2px', fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.04em', fontFamily: "'Space Grotesk'", marginBottom: '32px' }}>
        <span style={{ color: '#b1c5ff' }}>K</span>
        <span style={{ color: '#b1c5ff' }}>I</span>
        <span style={{ color: '#b1c5ff' }}>N</span>
        <span style={{ color: '#b1c5ff' }}>E</span>
        <span style={{ color: '#b1c5ff' }}>T</span>
        <span style={{ color: '#b1c5ff' }}>I</span>
        <span style={{ color: '#59d8de' }}>Q</span>
      </div>

      {success ? (
        <div>
          <h1 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: '1.75rem', fontWeight: 700,
            letterSpacing: '-0.04em', color: '#e2e2e8', marginBottom: '16px',
          }}>
            Password updated.
          </h1>
          <p style={{ fontFamily: 'Manrope', fontSize: '0.875rem', color: '#8e909c', marginBottom: '32px' }}>
            Your password has been changed successfully.
          </p>
          <button
            onClick={() => router.push('/auth/login')}
            className="btn-primary"
            style={{ color: '#002c70' }}
          >
            Sign in
          </button>
        </div>
      ) : (
        <>
          <h1 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: '1.75rem', fontWeight: 700,
            letterSpacing: '-0.04em', color: '#e2e2e8', marginBottom: '8px',
          }}>
            Set new password
          </h1>
          <p style={{ fontFamily: 'Manrope', fontSize: '0.875rem', color: '#8e909c', marginBottom: '32px' }}>
            Choose a strong password of at least 8 characters.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <label className="label-sm" style={{ color: '#444650', display: 'block', marginBottom: '8px' }}>
                New password
              </label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="k-input" placeholder="••••••••" required />
            </div>
            <div>
              <label className="label-sm" style={{ color: '#444650', display: 'block', marginBottom: '8px' }}>
                Confirm password
              </label>
              <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
                className="k-input" placeholder="••••••••" required />
            </div>
            {error && <p style={{ fontFamily: 'Manrope', fontSize: '0.75rem', color: '#ffb4ab' }}>{error}</p>}
            <button type="submit" className="btn-primary" disabled={loading} style={{ color: '#002c70' }}>
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
      minHeight: '100dvh', backgroundColor: '#0c0e12',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
    }}>
      <Suspense fallback={<p style={{ color: '#8e909c', fontFamily: 'Manrope' }}>Loading...</p>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}