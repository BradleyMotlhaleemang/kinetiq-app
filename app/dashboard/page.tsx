'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { mesocyclesApi } from '@/lib/api/mesocycles';
import { readinessApi } from '@/lib/api/readiness';
import { workoutsApi } from '@/lib/api/workouts';
import { BarChart3, Dumbbell, Play, Trophy, UserRound } from 'lucide-react';
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
      <div style={{ minHeight: '100dvh', backgroundColor: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--outline)', fontFamily: 'Manrope', fontSize: '0.875rem' }}>Loading...</div>
      </div>
    );
  }

  const activeWeek = mesocycle?.currentWeek ?? 1;
  const totalWeeks = mesocycle?.totalWeeks ?? 8;
  const progressPct = Math.round((activeWeek / totalWeeks) * 100);
  const suggestedDay = recentWorkouts.length > 0 ? 'Day 2 - Week 1' : 'Day 1 - Week 1';

  return (
    <div style={{ minHeight: '100dvh', backgroundColor: 'var(--surface)', paddingBottom: '96px' }}>
      <div style={{ maxWidth: '980px', margin: '0 auto', padding: '0 20px' }}>
        <AppHeader />

        <main style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <section style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <p className="label-sm" style={{ color: 'var(--primary)' }}>
              Performance Protocol Activated
            </p>
            <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '2rem', fontWeight: 700, lineHeight: 1.05, color: 'var(--on-surface)' }}>
              Welcome Barcola,
              <br />
              <span style={{ color: 'var(--primary)', fontStyle: 'italic' }}>Lightweight!!!</span>
            </h1>
            <p style={{ fontFamily: 'Manrope', fontSize: '0.75rem', color: 'var(--outline)' }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </section>

          <section style={{ backgroundColor: 'var(--surface-container)', border: '1px solid var(--surface-high)', borderLeft: '4px solid var(--primary)', borderRadius: '12px', padding: '16px' }}>
            <p className="label-sm" style={{ color: 'var(--outline)' }}>Current Mesocycle</p>
            <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.1rem', color: 'var(--on-surface)', fontWeight: 600, marginTop: '4px' }}>
              {mesocycle?.name ?? 'No active block'}
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', alignItems: 'center' }}>
              <p style={{ fontFamily: 'Manrope', fontSize: '0.75rem', color: 'var(--outline)' }}>
                Week {activeWeek} of {totalWeeks}
              </p>
              <div style={{ width: '120px', height: '6px', borderRadius: '9999px', backgroundColor: 'var(--surface-high)' }}>
                <div style={{ width: `${progressPct}%`, height: '100%', borderRadius: '9999px', backgroundColor: 'var(--primary)' }} />
              </div>
            </div>
          </section>

          <button onClick={startWorkout} className="btn-primary" style={{ color: 'var(--on-primary)', borderRadius: '16px', padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Start Session</span>
            <Play size={18} />
          </button>

          <section style={{ backgroundColor: 'var(--surface-container)', border: '1px solid var(--surface-high)', borderRadius: '12px', padding: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Dumbbell size={14} color="var(--outline)" />
              <p className="label-sm" style={{ color: 'var(--outline)' }}>Recent Workouts</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {recentWorkouts.slice(0, 3).map((workout) => (
                <div key={workout.id} style={{ backgroundColor: 'var(--surface-high)', borderRadius: '10px', padding: '10px', display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontFamily: 'Manrope', fontSize: '0.82rem', color: 'var(--on-surface)' }}>{workout.splitDayLabel ?? 'Training Session'}</p>
                    <p style={{ fontFamily: 'Manrope', fontSize: '0.68rem', color: 'var(--outline)' }}>{new Date(workout.completedAt).toLocaleDateString()}</p>
                  </div>
                  <p style={{ fontFamily: 'Manrope', fontSize: '0.72rem', color: 'var(--outline)' }}>{workout.totalSets} sets</p>
                </div>
              ))}
            </div>
          </section>

          <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div style={{ backgroundColor: 'var(--surface-container)', border: '1px solid var(--surface-high)', borderRadius: '12px', padding: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Trophy size={14} color="var(--secondary)" />
                <p className="label-sm" style={{ color: 'var(--outline)' }}>Achievements</p>
              </div>
              <p style={{ fontFamily: 'Manrope', fontSize: '0.8rem', color: 'var(--on-surface)' }}>Deadlift 220kg</p>
              <p style={{ fontFamily: 'Manrope', fontSize: '0.68rem', color: 'var(--secondary)' }}>New PR</p>
            </div>

            <div style={{ backgroundColor: 'var(--surface-container)', border: '1px solid var(--surface-high)', borderRadius: '12px', padding: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <BarChart3 size={14} color="var(--primary)" />
                <p className="label-sm" style={{ color: 'var(--outline)' }}>Performance Insight</p>
              </div>
              <p style={{ fontFamily: 'Manrope', fontSize: '0.8rem', color: 'var(--on-surface)' }}>Chest volume +5%</p>
              <p style={{ fontFamily: 'Manrope', fontSize: '0.68rem', color: 'var(--outline)' }}>Strong weekly trend</p>
            </div>
          </section>

          <section style={{ backgroundColor: 'var(--surface-container)', border: '1px solid var(--surface-high)', borderRadius: '12px', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserRound size={14} color="var(--primary)" />
              <p style={{ fontFamily: 'Manrope', fontSize: '0.8rem', color: 'var(--on-surface)' }}>
                Next Suggested Session: {suggestedDay}
              </p>
            </div>
            {readiness ? (
              <span style={{ fontFamily: 'Manrope', fontSize: '0.68rem', color: 'var(--outline)' }}>
                Readiness {Math.round(readiness.sessionReadiness * 100)}%
              </span>
            ) : (
              <button type="button" onClick={() => router.push('/readiness')} style={{ fontFamily: 'Manrope', fontSize: '0.68rem', color: 'var(--primary)' }}>
                Check-in
              </button>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
