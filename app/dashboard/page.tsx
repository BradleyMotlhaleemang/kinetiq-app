'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { mesocyclesApi } from '@/lib/api/mesocycles';
import { readinessApi } from '@/lib/api/readiness';
import { workoutsApi } from '@/lib/api/workouts';
import { Dumbbell, Zap, TrendingUp, Plus } from 'lucide-react';
import AppHeader from '@/components/AppHeader';

export default function DashboardPage() {
  const router = useRouter();
  const [readiness, setReadiness] = useState<any>(null);
  const [mesocycle, setMesocycle] = useState<any>(null);
  const [recentWorkouts, setRecentWorkouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

 const { isAuthenticated, hydrated } = useAuthStore();

useEffect(() => {
  if (!hydrated) return;
  if (!isAuthenticated()) {
    router.push('/auth/login');
    return;
  }
  loadData();
}, [hydrated]);
  

  async function loadData() {
    try {
      const [readinessRes, mesocycleRes, historyRes] = await Promise.allSettled([
        readinessApi.latest(),
        mesocyclesApi.active(),
        workoutsApi.history(),
      ]);
      if (readinessRes.status === 'fulfilled') setReadiness(readinessRes.value.data);
      if (mesocycleRes.status === 'fulfilled') setMesocycle(mesocycleRes.value.data);
      if (historyRes.status === 'fulfilled') setRecentWorkouts(historyRes.value.data.slice(0, 3));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

 async function startWorkout() {
  try {
    const res = await workoutsApi.create({ mesocycleId: mesocycle?.id });
    router.push(`/workout/${res.data.id}`);
  } catch (err) {
    console.error(err);
  }
}

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-zinc-400 text-sm">Loading...</div>
      </div>
    );
  }

 return (
  <div style={{ minHeight: '100dvh', backgroundColor: '#111318', paddingBottom: '96px' }}>
    {/* Background glow */}
    <div style={{ position: 'fixed', top: 0, right: 0, width: '500px', height: '500px', background: 'rgba(177,197,255,0.04)', filter: 'blur(120px)', borderRadius: '50%', transform: 'translate(30%, -30%)', pointerEvents: 'none', zIndex: 0 }} />

    <div style={{ maxWidth: '480px', margin: '0 auto', padding: '0 20px', position: 'relative', zIndex: 1 }}>
      <AppHeader />

      <p className="label-sm" style={{ color: '#444650', paddingLeft: '2px', marginBottom: '24px' }}>
        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
      </p>

      {/* rest of dashboard content */}

    {readiness && readiness.sessionMode ? (
      <div style={{
        borderRadius: '0.125rem',
        borderTopRightRadius: '0.75rem',
        padding: '16px',
        backgroundColor: readiness.sessionMode === 'FULL' ? '#0a1f10' : readiness.sessionMode === 'MODIFIED' ? '#1a1400' : '#1a0a08',
        borderLeft: `2px solid ${readiness.sessionMode === 'FULL' ? '#59d8de' : readiness.sessionMode === 'MODIFIED' ? '#a2e7ff' : '#ffb4ab'}`,
        marginBottom: '16px',
      }}>
        <p style={{ fontFamily: "'Space Grotesk'", fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: readiness.sessionMode === 'FULL' ? '#59d8de' : readiness.sessionMode === 'MODIFIED' ? '#a2e7ff' : '#ffb4ab', marginBottom: '4px' }}>
          {readiness.sessionModeLabel ?? readiness.sessionMode}
        </p>
        <p style={{ fontFamily: 'Manrope', fontSize: '0.75rem', color: '#8e909c' }}>
          Readiness: {Math.round(readiness.sessionReadiness * 100)}%
        </p>
      </div>
    ) : (
      <div
        onClick={() => router.push('/readiness')}
        style={{
          backgroundColor: '#1a1c20',
          borderTopRightRadius: '0.75rem',
          borderBottomLeftRadius: '0px',
          borderTopLeftRadius: '0.125rem',
          borderBottomRightRadius: '0.125rem',
          padding: '16px',
          cursor: 'pointer',
          marginBottom: '16px',
          borderLeft: '2px solid #444650',
        }}
      >
        <p style={{ fontFamily: "'Space Grotesk'", fontSize: '0.875rem', fontWeight: 600, color: '#e2e2e8', marginBottom: '4px' }}>
          Complete readiness check-in
        </p>
        <p style={{ fontFamily: 'Manrope', fontSize: '0.75rem', color: '#8e909c' }}>
          Required before starting a session
        </p>
      </div>
    )}

    <button onClick={startWorkout} className="btn-primary" style={{ marginBottom: '24px', color: '#002c70' }}>
      Start New Session
    </button>

    {!mesocycle && (
      <button
        onClick={() => router.push('/mesocycles/new')}
        className="w-full rounded-xl p-4 border border-zinc-800 bg-zinc-900 text-left hover:bg-zinc-800 transition"
      >
        <p className="text-white font-medium text-sm">Create your training block</p>
        <p className="text-zinc-400 text-xs mt-1">
          We&apos;ll recommend a template based on your goal and experience.
        </p>
      </button>
    )}

    {mesocycle && (
      <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp size={16} className="text-zinc-400" />
          <span className="text-zinc-300 text-sm font-medium">
            Current Block
          </span>
        </div>
        <p className="text-white font-medium">{mesocycle.name}</p>
        <p className="text-zinc-400 text-xs mt-1">
          Week {mesocycle.currentWeek} of {mesocycle.totalWeeks} —{' '}
          {mesocycle.statusLabel ?? mesocycle.status}
        </p>
      </div>
    )}

    {recentWorkouts.length > 0 && (
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Dumbbell size={16} className="text-zinc-400" />
          <span className="text-zinc-300 text-sm font-medium">
            Recent Sessions
          </span>
        </div>

        <div className="space-y-2">
          {recentWorkouts.map((workout) => (
            <div
              key={workout.id}
              className="rounded-xl bg-zinc-900 border border-zinc-800 p-4"
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-white text-sm font-medium">
                    {workout.splitDayLabel ?? 'Training Session'}
                  </p>
                  <p className="text-zinc-400 text-xs mt-0.5">
                    {new Date(workout.completedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-white text-sm">
                    {workout.totalSets} sets
                  </p>
                  <p className="text-zinc-400 text-xs">
                    {Math.round(workout.totalVolume ?? 0)} kg vol
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}
    </div>
  </div>
);
}
