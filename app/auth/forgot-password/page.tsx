'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api/client';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
    } catch {
      // always show success
    } finally {
      setLoading(false);
      setSubmitted(true);
    }
  }

  return (
    <div style={{
      minHeight: '100dvh', backgroundColor: '#0c0e12',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: '360px' }}>
        <button
          onClick={() => router.push('/auth/login')}
          style={{
            fontFamily: 'Manrope', fontSize: '0.75rem', color: '#444650',
            background: 'none', border: 'none', cursor: 'pointer',
            marginBottom: '32px', display: 'block',
            letterSpacing: '0.05em',
          }}
        >
          ← Back to sign in
        </button>

        <div style={{ display: 'flex', gap: '2px', fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.04em', fontFamily: "'Space Grotesk'", marginBottom: '32px' }}>
          <span style={{ color: '#b1c5ff' }}>K</span>
          <span style={{ color: '#b1c5ff' }}>I</span>
          <span style={{ color: '#b1c5ff' }}>N</span>
          <span style={{ color: '#b1c5ff' }}>E</span>
          <span style={{ color: '#b1c5ff' }}>T</span>
          <span style={{ color: '#b1c5ff' }}>I</span>
          <span style={{ color: '#59d8de' }}>Q</span>
        </div>

        {submitted ? (
          <div>
            <h1 style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: '1.75rem', fontWeight: 700,
              letterSpacing: '-0.04em', color: '#e2e2e8', marginBottom: '16px',
            }}>
              Check your email.
            </h1>
            <p style={{ fontFamily: 'Manrope', fontSize: '0.875rem', color: '#8e909c', lineHeight: 1.7 }}>
              If that email is registered, you will receive a reset link shortly.
            </p>
          </div>
        ) : (
          <>
            <h1 style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: '1.75rem', fontWeight: 700,
              letterSpacing: '-0.04em', color: '#e2e2e8', marginBottom: '8px',
            }}>
              Forgot password?
            </h1>
            <p style={{
              fontFamily: 'Manrope', fontSize: '0.875rem',
              color: '#8e909c', marginBottom: '32px',
            }}>
              Enter your email and we will send you a reset link.
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <label className="label-sm" style={{ color: '#444650', display: 'block', marginBottom: '8px' }}>
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="k-input"
                  placeholder="you@example.com"
                  required
                />
              </div>
              <button type="submit" className="btn-primary" disabled={loading} style={{ color: '#002c70' }}>
                {loading ? 'Sending...' : 'Send reset link'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}