'use client';

import AppHeader from '@/components/AppHeader';

export default function ExercisesPage() {
  return (
    <div style={{ minHeight: '100dvh', backgroundColor: '#111318', paddingBottom: '96px' }}>
      <AppHeader title="Exercises" />
      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '0 20px' }}>
        <p style={{ fontFamily: 'Manrope', fontSize: '0.875rem', color: '#8e909c' }}>
          Exercise library coming soon.
        </p>
      </div>
    </div>
  );
}