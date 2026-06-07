'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Verification link is missing or invalid.');
      return;
    }

    authApi
      .verifyEmail(token)
      .then((res) => {
        setStatus('success');
        setMessage(res.data?.message ?? 'Email verified successfully.');
      })
      .catch((err) => {
        setStatus('error');
        if (err instanceof ApiError) {
          setMessage(err.message);
        } else {
          setMessage('Verification failed. The link may have expired.');
        }
      });
  }, [token]);

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

      {status === 'loading' && (
        <p style={{ fontFamily: 'Manrope', fontSize: '0.875rem', color: '#8e909c' }}>
          Verifying your email...
        </p>
      )}

      {status === 'success' && (
        <>
          <h1 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: '1.75rem', fontWeight: 700,
            letterSpacing: '-0.04em', color: '#e2e2e8', marginBottom: '16px',
          }}>
            Email verified.
          </h1>
          <p style={{ fontFamily: 'Manrope', fontSize: '0.875rem', color: '#8e909c', lineHeight: 1.7, marginBottom: '32px' }}>
            {message}
          </p>
          <button
            onClick={() => router.push('/auth/login')}
            className="btn-primary"
            style={{ color: '#002c70' }}
          >
            Sign in
          </button>
        </>
      )}

      {status === 'error' && (
        <>
          <h1 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: '1.75rem', fontWeight: 700,
            letterSpacing: '-0.04em', color: '#ffb4ab', marginBottom: '16px',
          }}>
            Verification failed.
          </h1>
          <p style={{ fontFamily: 'Manrope', fontSize: '0.875rem', color: '#8e909c', lineHeight: 1.7, marginBottom: '32px' }}>
            {message}
          </p>
          <Link href="/auth/login" style={{ color: '#b1c5ff', fontFamily: 'Manrope', fontSize: '0.875rem', textDecoration: 'none' }}>
            Back to sign in
          </Link>
        </>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div style={{
      minHeight: '100dvh', backgroundColor: '#0c0e12',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
    }}>
      <Suspense fallback={<p style={{ color: '#8e909c', fontFamily: 'Manrope' }}>Loading...</p>}>
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}
