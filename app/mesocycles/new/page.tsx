'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { mesocyclesApi, type MesocycleRecommendation, type RecommendedTemplate } from '@/lib/api/mesocycles';
import { useAuthStore } from '@/store/auth.store';

const TOTAL_WEEK_OPTIONS = [4, 6, 8];

export default function NewMesocyclePage() {
  const router = useRouter();
  const { hydrated, isAuthenticated } = useAuthStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [recommendation, setRecommendation] = useState<MesocycleRecommendation | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [name, setName] = useState('');
  const [totalWeeks, setTotalWeeks] = useState(8);

  useEffect(() => {
    if (!hydrated) return;
    if (!isAuthenticated()) {
      router.push('/auth/login');
      return;
    }

    void loadRecommendation();
  }, [hydrated, isAuthenticated, router]);

  async function loadRecommendation() {
    setLoading(true);
    setError('');

    try {
      const res = await mesocyclesApi.recommend();
      const data = res.data as MesocycleRecommendation;
      setRecommendation(data);
      setSelectedTemplateId(data.recommended.id);
      setName(`${data.recommended.name} Block`);
    } catch (err) {
      console.error(err);
      setError('Could not load your template recommendation.');
    } finally {
      setLoading(false);
    }
  }

  const templates = useMemo(() => {
    if (!recommendation) return [];
    return [recommendation.recommended, ...recommendation.alternatives];
  }, [recommendation]);

  const selectedTemplate = templates.find((template) => template.id === selectedTemplateId) ?? null;

  async function handleCreate() {
    if (!selectedTemplateId || !name.trim()) {
      setError('Add a block name and choose a template.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      await mesocyclesApi.generate({
        name: name.trim(),
        totalWeeks,
        templateId: selectedTemplateId,
      });
      router.push('/dashboard');
    } catch (err) {
      console.error(err);
      setError('Could not create your training block.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-zinc-400 text-sm">Loading your recommendation...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black px-4 pt-12 pb-24">
      <div className="max-w-sm mx-auto space-y-8">
        <div>
          <button
            onClick={() => router.back()}
            className="text-zinc-400 text-sm mb-4 block"
          >
            Back
          </button>
          <div className="flex gap-1 mb-6">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className={`h-1 flex-1 rounded-full ${
                  item <= step ? 'bg-white' : 'bg-zinc-800'
                }`}
              />
            ))}
          </div>
          <h1 className="text-2xl font-bold text-white">
            {step === 1 && 'Choose your template'}
            {step === 2 && 'Name your training block'}
            {step === 3 && 'Set your block length'}
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            {step === 1 && recommendation?.rationale}
            {step === 2 && 'This is what you will see on your dashboard.'}
            {step === 3 && 'Most hypertrophy blocks work well between 4 and 8 weeks.'}
          </p>
        </div>

        {step === 1 && (
          <div className="space-y-3">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
              <p className="text-zinc-400 text-xs uppercase tracking-wide">Profile</p>
              <p className="text-white text-sm mt-2">
                {recommendation?.profile.goalModeLabel ?? 'Goal not set'} ·{' '}
                {recommendation?.profile.experienceLevelLabel ?? 'Experience not set'}
              </p>
            </div>

            {templates.map((template, index) => {
              const isRecommended = recommendation?.recommended.id === template.id;
              const isSelected = selectedTemplateId === template.id;

              return (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplateId(template.id)}
                  className={`w-full text-left rounded-xl p-4 border transition ${
                    isSelected
                      ? 'bg-white border-white'
                      : 'bg-zinc-900 border-zinc-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p
                        className={`font-medium text-sm ${
                          isSelected ? 'text-black' : 'text-white'
                        }`}
                      >
                        {template.name}
                      </p>
                      <p
                        className={`text-xs mt-1 ${
                          isSelected ? 'text-zinc-700' : 'text-zinc-400'
                        }`}
                      >
                        {template.splitTypeLabel} · {template.daysPerWeek} days/week
                      </p>
                      <p
                        className={`text-xs mt-1 ${
                          isSelected ? 'text-zinc-700' : 'text-zinc-500'
                        }`}
                      >
                        {template.splits[0]?.days.length ?? 0} training days ·{' '}
                        {template.splits[0]?.days[0]?.exercises.length ?? 0}+ movements
                      </p>
                    </div>
                    {isRecommended && (
                      <span
                        className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                          isSelected
                            ? 'bg-black text-white'
                            : 'bg-emerald-900 text-emerald-200'
                        }`}
                      >
                        Recommended
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
              <p className="text-zinc-400 text-xs uppercase tracking-wide">Selected template</p>
              <p className="text-white text-sm mt-2">{selectedTemplate?.name}</p>
            </div>

            <div>
              <label className="text-zinc-300 text-sm block mb-2">Block name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-4 text-white text-base focus:outline-none focus:border-zinc-400"
                placeholder="Upper Lower Block"
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 space-y-2">
              <p className="text-zinc-400 text-xs uppercase tracking-wide">Summary</p>
              <p className="text-white text-sm">{name || selectedTemplate?.name}</p>
              <p className="text-zinc-400 text-xs">
                {selectedTemplate?.splitTypeLabel} · {selectedTemplate?.daysPerWeek} days/week
              </p>
            </div>

            <div className="space-y-3">
              {TOTAL_WEEK_OPTIONS.map((option) => (
                <button
                  key={option}
                  onClick={() => setTotalWeeks(option)}
                  className={`w-full text-left rounded-xl p-4 border transition ${
                    totalWeeks === option
                      ? 'bg-white border-white text-black'
                      : 'bg-zinc-900 border-zinc-800 text-white'
                  }`}
                >
                  <p className="font-medium text-sm">{option} weeks</p>
                  <p
                    className={`text-xs mt-1 ${
                      totalWeeks === option ? 'text-zinc-700' : 'text-zinc-400'
                    }`}
                  >
                    {option === 4 && 'Short, focused block'}
                    {option === 6 && 'Balanced progression window'}
                    {option === 8 && 'Standard hypertrophy mesocycle'}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <div className="flex gap-3">
          {step > 1 && (
            <button
              onClick={() => setStep((current) => current - 1)}
              className="flex-1 border border-zinc-700 text-white font-medium py-4 rounded-xl hover:bg-zinc-900 transition"
            >
              Back
            </button>
          )}

          {step < 3 ? (
            <button
              onClick={() => setStep((current) => current + 1)}
              disabled={(step === 1 && !selectedTemplateId) || (step === 2 && !name.trim())}
              className="flex-1 bg-white text-black font-semibold py-4 rounded-xl hover:bg-zinc-200 transition disabled:opacity-50"
            >
              Continue
            </button>
          ) : (
            <button
              onClick={handleCreate}
              disabled={saving}
              className="flex-1 bg-white text-black font-semibold py-4 rounded-xl hover:bg-zinc-200 transition disabled:opacity-50"
            >
              {saving ? 'Creating...' : 'Create Block'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
