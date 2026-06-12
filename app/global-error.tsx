'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#111318',
          color: '#e2e2e8',
          fontFamily: 'Manrope, sans-serif',
          padding: 24,
        }}
      >
        <div style={{ maxWidth: 420, textAlign: 'center' }}>
          <h1 style={{ fontSize: 22, margin: '0 0 12px' }}>Something went wrong</h1>
          <p style={{ margin: '0 0 20px', color: '#8e909c', lineHeight: 1.5 }}>
            An unexpected error occurred. The team has been notified if error reporting
            is enabled.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              padding: '12px 20px',
              borderRadius: 10,
              border: 'none',
              background: '#b1c5ff',
              color: '#05080f',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
