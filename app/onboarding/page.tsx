'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api/client';

const GOAL_OPTIONS = [
  { value: 'MUSCLE_GAIN', label: 'Build Muscle', description: 'Maximize hypertrophy and size' },
  { value: 'STRENGTH', label: 'Build Strength', description: 'Focus on compound lifts and PRs' },
  { value: 'WEIGHT_LOSS', label: 'Lose Fat', description: 'Maintain muscle while losing fat' },
  { value: 'MAINTAIN', label: 'Maintain', description: 'Keep current fitness level' },
];

const EXPERIENCE_OPTIONS = [
  { value: 'BEGINNER', label: 'Beginner', description: 'Less than 1 year training' },
  { value: 'INTERMEDIATE', label: 'Intermediate', description: '1–3 years training' },
  { value: 'ADVANCED', label: 'Advanced', description: '3+ years training' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [goalMode, setGoalMode] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [bodyweightKg, setBodyweightKg] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleFinish() {
    if (!goalMode) {
      setError('Please select a goal');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.patch('/api/v1/users/me/onboarding', {
        goalMode,
        experienceLevel: experienceLevel || 'INTERMEDIATE',
        bodyweightKg: bodyweightKg ? parseFloat(bodyweightKg) : undefined,
      });
      router.push('/dashboard');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black px-4 pt-12 pb-24">
      <div className="max-w-sm mx-auto space-y-8">

        <div>
          <div className="flex gap-1 mb-6">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full ${
                  s <= step ? 'bg-white' : 'bg-zinc-800'
                }`}
              />
            ))}
          </div>
          <h1 className="text-2xl font-bold text-white">
            {step === 1 && 'What is your goal?'}
            {step === 2 && 'Experience level'}
            {step === 3 && 'Your bodyweight'}
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            {step === 1 && 'This shapes your training prescriptions'}
            {step === 2 && 'This helps calibrate your starting loads'}
            {step === 3 && 'Used for fatigue calculations'}
          </p>
        </div>

        {step === 1 && (
          <div className="space-y-3">
            {GOAL_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setGoalMode(option.value)}
                className={`w-full text-left rounded-xl p-4 border transition ${
                  goalMode === option.value
                    ? 'bg-white border-white'
                    : 'bg-zinc-900 border-zinc-800'
                }`}
              >
                <p className={`font-medium text-sm ${
                  goalMode === option.value ? 'text-black' : 'text-white'
                }`}>
                  {option.label}
                </p>
                <p className={`text-xs mt-0.5 ${
                  goalMode === option.value ? 'text-zinc-600' : 'text-zinc-400'
                }`}>
                  {option.description}
                </p>
              </button>
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            {EXPERIENCE_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setExperienceLevel(option.value)}
                className={`w-full text-left rounded-xl p-4 border transition ${
                  experienceLevel === option.value
                    ? 'bg-white border-white'
                    : 'bg-zinc-900 border-zinc-800'
                }`}
              >
                <p className={`font-medium text-sm ${
                  experienceLevel === option.value ? 'text-black' : 'text-white'
                }`}>
                  {option.label}
                </p>
                <p className={`text-xs mt-0.5 ${
                  experienceLevel === option.value ? 'text-zinc-600' : 'text-zinc-400'
                }`}>
                  {option.description}
                </p>
              </button>
            ))}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div>
              <label className="text-zinc-300 text-sm block mb-2">
                Bodyweight (kg)
              </label>
              <input
                type="number"
                value={bodyweightKg}
                onChange={(e) => setBodyweightKg(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-4 text-white text-lg focus:outline-none focus:border-zinc-400"
                placeholder="80"
              />
            </div>
            <p className="text-zinc-500 text-xs">
              You can update this anytime in your profile.
            </p>
          </div>
        )}

        {error && (
          <p className="text-red-400 text-sm">{error}</p>
        )}

        <div className="flex gap-3">
          {step > 1 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="flex-1 border border-zinc-700 text-white font-medium py-4 rounded-xl hover:bg-zinc-900 transition"
            >
              Back
            </button>
          )}
          {step < 3 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={step === 1 && !goalMode}
              className="flex-1 bg-white text-black font-semibold py-4 rounded-xl hover:bg-zinc-200 transition disabled:opacity-50"
            >
              Continue
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={loading}
              className="flex-1 bg-white text-black font-semibold py-4 rounded-xl hover:bg-zinc-200 transition disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Get Started'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}