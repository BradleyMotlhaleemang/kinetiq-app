'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import api, { ApiError } from '@/lib/api/client';
import { TrendingUp, BarChart2, Zap } from 'lucide-react';

export default function AnalyticsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [strengthTrends, setStrengthTrends] = useState<any[]>([]);
  const [weeklyVolume, setWeeklyVolume] = useState<any[]>([]);
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth/login');
      return;
    }
    loadData();
  }, []);

  async function loadData() {
    try {
      const [strengthRes, volumeRes, insightsRes] = await Promise.allSettled([
        api.get('/api/v1/analytics/strength/trends'),
        api.get('/api/v1/analytics/volume/weekly'),
        api.get('/api/v1/analytics/insights'),
      ]);

      if (strengthRes.status === 'fulfilled') setStrengthTrends(strengthRes.value.data);
      if (volumeRes.status === 'fulfilled') setWeeklyVolume(volumeRes.value.data);
      if (insightsRes.status === 'fulfilled') setInsights(insightsRes.value.data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setStrengthTrends([]);
        setWeeklyVolume([]);
        setInsights(null);
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
        <p className="text-zinc-400 text-sm">Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black px-4 pt-12 pb-24">
      <div className="max-w-sm mx-auto space-y-6">

        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-zinc-400 text-sm mt-1">Your performance overview</p>
        </div>

        {weeklyVolume.length > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-800 flex items-center gap-2">
              <BarChart2 size={16} className="text-zinc-400" />
              <p className="text-zinc-300 text-sm font-medium">Weekly Volume</p>
            </div>
            <div className="p-4 space-y-3">
              {weeklyVolume.map((item: any) => (
                <div key={item.muscle}>
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-white text-xs font-medium">
                      {item.muscle.replace('_', ' ')}
                    </p>
                    <p className={`text-xs font-medium ${
                      item.status === 'BELOW_MEV'
                        ? 'text-red-400'
                        : item.status === 'ABOVE_MRV'
                        ? 'text-amber-400'
                        : 'text-green-400'
                    }`}>
                      {item.setsThisWeek} sets
                    </p>
                  </div>
                  <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        item.status === 'BELOW_MEV'
                          ? 'bg-red-500'
                          : item.status === 'ABOVE_MRV'
                          ? 'bg-amber-500'
                          : 'bg-green-500'
                      }`}
                      style={{
                        width: `${Math.min(
                          (item.setsThisWeek / item.mrv) * 100,
                          100,
                        )}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between mt-0.5">
                    <p className="text-zinc-600 text-xs">MEV {item.mev}</p>
                    <p className="text-zinc-600 text-xs">MRV {item.mrv}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {strengthTrends.length > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-800 flex items-center gap-2">
              <TrendingUp size={16} className="text-zinc-400" />
              <p className="text-zinc-300 text-sm font-medium">Key Lifts</p>
            </div>
            <div className="divide-y divide-zinc-800">
              {strengthTrends.map((lift: any) => {
                const latest = lift.history[lift.history.length - 1];
                const previous = lift.history[lift.history.length - 2];
                const trend = latest && previous
                  ? latest.bestE1rm - previous.bestE1rm
                  : 0;

                return (
                  <div key={lift.exercise} className="px-4 py-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-white text-sm font-medium">
                          {lift.exercise}
                        </p>
                        <p className="text-zinc-400 text-xs mt-0.5">
                          {lift.history.length} sessions logged
                        </p>
                      </div>
                      <div className="text-right">
                        {latest && (
                          <>
                            <p className="text-white text-sm font-bold">
                              {Math.round(latest.bestE1rm)}kg
                            </p>
                            <p className={`text-xs ${
                              trend > 0
                                ? 'text-green-400'
                                : trend < 0
                                ? 'text-red-400'
                                : 'text-zinc-400'
                            }`}>
                              {trend > 0 ? '+' : ''}{Math.round(trend)}kg e1RM
                            </p>
                          </>
                        )}
                        {!latest && (
                          <p className="text-zinc-500 text-xs">No data yet</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {insights && insights.plateaus?.length > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-800 flex items-center gap-2">
              <Zap size={16} className="text-zinc-400" />
              <p className="text-zinc-300 text-sm font-medium">Coaching Insights</p>
            </div>
            <div className="divide-y divide-zinc-800">
              {insights.plateaus.map((plateau: any) => (
                <div key={plateau.id} className="px-4 py-4">
                  <p className="text-amber-300 text-sm font-medium">
                    Plateau detected
                  </p>
                  <p className="text-white text-sm mt-0.5">
                    {plateau.exercise?.name}
                  </p>
                  <p className="text-zinc-400 text-xs mt-0.5">
                    {plateau.reason}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {weeklyVolume.length === 0 && strengthTrends.every(t => t.history.length === 0) && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
            <BarChart2 size={32} className="text-zinc-600 mx-auto mb-3" />
            <p className="text-white text-sm font-medium">No data yet</p>
            <p className="text-zinc-400 text-xs mt-1">
              Complete sessions to see your analytics
            </p>
          </div>
        )}
      </div>
    </div>
  );
}