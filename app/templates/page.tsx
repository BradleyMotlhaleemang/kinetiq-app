'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TemplatesPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/mesocycles/new');
  }, [router]);

  return (
    <div
      style={{
        minHeight: '100dvh',
        backgroundColor: '#111318',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Manrope, sans-serif',
        color: '#8e909c',
        fontSize: 13,
      }}
    >
      Redirecting to program selection…
    </div>
  );
}
