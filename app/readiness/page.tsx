'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import { readinessApi } from '@/lib/api/readiness';

const SCORES = [1, 2, 3, 4, 5];

const LABELS: Record<string, string[]> = {
  sleepScore: ['Terrible', 'Poor', 'Okay', 'Good', 'Great'],
 stressScore: ['None', 'Low', 'Moderate', 'High', 'Very High'],
  nutritionScore: ['Very Poor', 'Poor', 'Okay', 'Good', 'Great'],
  motivationScore: ['None', 'Low', 'Moderate', 'High', 'Pumped'],
  muscleReadinessScore: ['Very Sore', 'Sore', 'Okay', 'Fresh', 'Very Fresh'],
};

const FIELDS = [
  { key: 'sleepScore', label: 'Sleep Quality' },
  { key: 'stressScore', label: 'Stress Level' },
  { key: 'nutritionScore', label: 'Nutrition Yesterday' },
  { key: 'motivationScore', label: 'Motivation' },
  { key: 'muscleReadinessScore', label: 'Muscle Readiness' },
];

export default function ReadinessPage() {
  const router = useRouter();
  const [scores, setScores] = useState<Record<string, number>>({
    sleepScore: 3,
    stressScore: 3,
    nutritionScore: 3,
    motivationScore: 3,
    muscleReadinessScore: 3,
  });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    setLoading(true);
    setError('');
    try {
      const res = await readinessApi.checkIn({
        sleepScore: scores.sleepScore,
        stressScore: scores.stressScore,
        nutritionScore: scores.nutritionScore,
        motivationScore: scores.motivationScore,
        muscleReadinessScore: scores.muscleReadinessScore,
      });
      setResult(res.data);
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      if (msg?.includes('already')) {
        setError('You have already checked in today.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    const color =
      result.sessionMode === 'FULL'
        ? 'green'
        : result.sessionMode === 'MODIFIED'
        ? 'amber'
        : 'red';

    return (
      <div className="min-h-screen bg-black px-4 pt-12 pb-24 flex flex-col items-center justify-center">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div
            className={`rounded-2xl p-8 border ${
              color === 'green'
                ? 'bg-green-950 border-green-800'
                : color === 'amber'
                ? 'bg-amber-950 border-amber-800'
                : 'bg-red-950 border-red-800'
            }`}
          >
            <p className="text-4xl font-bold text-white mb-2">
              {Math.round(result.sessionReadiness * 100)}%
            </p>
            <p className="text-white font-medium text-lg">
              {result.sessionModeLabel ?? result.sessionMode}
            </p>
            <p className="text-zinc-300 text-sm mt-2">
              Today's readiness score
            </p>
          </div>

          <button
            onClick={() => router.push('/dashboard')}
            className="w-full bg-white text-black font-semibold py-4 rounded-xl hover:bg-zinc-200 transition"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black px-4 pt-12 pb-24">
      <div className="max-w-sm mx-auto space-y-8">
        <AppHeader title="Readiness Check-in" showBack />
        <div>
          <p className="text-zinc-400 text-sm mt-1">
            How are you feeling today?
          </p>
        </div>

        <div className="space-y-8">
          {FIELDS.map(({ key, label }) => (
            <div key={key}>
              <div className="flex justify-between items-center mb-3">
                <p className="text-white text-sm font-medium">{label}</p>
                <p className="text-zinc-400 text-xs">
                  {LABELS[key][scores[key] - 1]}
                </p>
              </div>
              <div className="flex gap-2">
                {SCORES.map((score) => (
                  <button
                    key={score}
                    onClick={() => setScores((s) => ({ ...s, [key]: score }))}
                    className={`flex-1 py-3 rounded-lg text-sm font-medium transition ${
                      scores[key] === score
                        ? 'bg-white text-black'
                        : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                    }`}
                  >
                    {score}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {error && (
          <p className="text-red-400 text-sm text-center">{error}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-white text-black font-semibold py-4 rounded-xl hover:bg-zinc-200 transition disabled:opacity-50"
        >
          {loading ? 'Submitting...' : 'Submit Check-in'}
        </button>
      </div>
    </div>
  );
}