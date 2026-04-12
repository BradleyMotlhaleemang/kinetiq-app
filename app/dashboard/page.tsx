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
  <div className="min-h-screen bg-black text-white p-4 space-y-4">
    <AppHeader title="Dashboard" />

    <p className="text-zinc-400 text-sm -mt-4 px-1">
      {new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      })}
    </p>

    {readiness && readiness.sessionMode ? (
      <div
        className={`rounded-xl p-4 border ${
          readiness.sessionMode === 'FULL'
            ? 'bg-green-950 border-green-800'
            : readiness.sessionMode === 'MODIFIED'
            ? 'bg-amber-950 border-amber-800'
            : 'bg-red-950 border-red-800'
        }`}
      >
        <div className="flex items-center gap-2 mb-1">
          <Zap size={16} className="text-white" />
          <span className="text-white text-sm font-medium">
            {readiness.sessionModeLabel ?? readiness.sessionMode}
          </span>
        </div>
        <p className="text-zinc-300 text-xs">
          Readiness: {Math.round(readiness.sessionReadiness * 100)}%
        </p>
      </div>
    ) : (
      <button
        onClick={() => router.push('/readiness')}
        className="w-full rounded-xl p-4 border border-amber-700 bg-amber-950 text-left"
      >
        <div className="flex items-center gap-2 mb-1">
          <Zap size={16} className="text-amber-400" />
          <span className="text-amber-200 text-sm font-medium">
            Complete your readiness check-in
          </span>
        </div>
        <p className="text-amber-300 text-xs">
          Tap here to check in before your session
        </p>
      </button>
    )}

    <button
      onClick={startWorkout}
      className="w-full bg-white text-black font-semibold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-zinc-200 transition"
    >
      <Plus size={18} />
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
);
}
