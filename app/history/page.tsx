'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { workoutsApi } from '@/lib/api/workouts';
import { ApiError } from '@/lib/api/client';
import { Dumbbell, ChevronRight } from 'lucide-react';

export default function HistoryPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth/login');
      return;
    }
    loadHistory();
  }, []);

  async function loadHistory() {
    try {
      const res = await workoutsApi.history();
      setWorkouts(res.data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setWorkouts([]);
        return;
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-zinc-400 text-sm">Loading history...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black px-4 pt-12 pb-24">
      <div className="max-w-sm mx-auto space-y-6">

        <div>
          <h1 className="text-2xl font-bold text-white">History</h1>
          <p className="text-zinc-400 text-sm mt-1">
            {workouts.length} completed sessions
          </p>
        </div>

        {workouts.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
            <Dumbbell size={32} className="text-zinc-600 mx-auto mb-3" />
            <p className="text-white text-sm font-medium">No sessions yet</p>
            <p className="text-zinc-400 text-xs mt-1">
              Complete your first session to see it here
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="mt-4 bg-white text-black text-sm font-medium px-6 py-2 rounded-lg hover:bg-zinc-200 transition"
            >
              Start Training
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {workouts.map((workout) => {
              const date = new Date(workout.completedAt);
              const dateStr = date.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              });
              const timeStr = date.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={workout.id}
                  className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center">
                        <Dumbbell size={16} className="text-zinc-300" />
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">
                          {workout.splitDayLabel ?? 'Training Session'}
                        </p>
                        <p className="text-zinc-400 text-xs mt-0.5">
                          {dateStr} at {timeStr}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mt-4">
                    <div className="bg-zinc-800 rounded-xl p-3 text-center">
                      <p className="text-white text-sm font-bold">
                        {workout.totalSets ?? 0}
                      </p>
                      <p className="text-zinc-400 text-xs mt-0.5">Sets</p>
                    </div>
                    <div className="bg-zinc-800 rounded-xl p-3 text-center">
                      <p className="text-white text-sm font-bold">
                        {Math.round(workout.totalVolume ?? 0)}
                      </p>
                      <p className="text-zinc-400 text-xs mt-0.5">Vol (kg)</p>
                    </div>
                    <div className="bg-zinc-800 rounded-xl p-3 text-center">
                      <p className="text-white text-sm font-bold">
                        {workout.sets?.length ?? 0}
                      </p>
                      <p className="text-zinc-400 text-xs mt-0.5">Exercises</p>
                    </div>
                  </div>

                  {workout.sets && workout.sets.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-zinc-800">
                      <p className="text-zinc-500 text-xs mb-2">Top sets</p>
                      <div className="space-y-1">
                        {workout.sets.slice(0, 3).map((set: any, i: number) => (
                          <div
                            key={set.id ?? i}
                            className="flex justify-between items-center"
                          >
                            <p className="text-zinc-300 text-xs">
                              Set {set.setNumber}
                            </p>
                            <p className="text-zinc-300 text-xs">
                              {set.weight}kg × {set.reps} reps
                            </p>
                            <p className="text-zinc-500 text-xs">
                              e1RM {Math.round(set.e1rm ?? 0)}kg
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}