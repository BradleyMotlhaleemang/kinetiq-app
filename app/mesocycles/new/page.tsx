'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import { type MesocycleRecommendation, mesocyclesApi } from '@/lib/api/mesocycles';
import {
  MUSCLE_FOCUS_COLOR,
  SPLIT_LABELS,
  TEMPLATE_CATALOG,
  type SplitType,
  type TemplateDefinition,
} from '@/lib/templates/catalog';
import { AlertTriangle, Info, Search, X } from 'lucide-react';
import { exercisesApi } from '@/lib/api/exercises';

type BuildMode = 'USE_TEMPLATE' | 'CREATE_FROM_SCRATCH';
type ScratchExercise = { id: string; name: string; primaryMuscle?: string };
type ScratchDay = { label: string; primaryMuscle: string; exercises: ScratchExercise[] };

const DEFAULT_SPLIT_DAYS: Record<SplitType, string[]> = {
  FULL_BODY: ['Day 1 - Full Body', 'Day 2 - Full Body', 'Day 3 - Full Body'],
  PPL: ['Day 1 - Push', 'Day 2 - Pull', 'Day 3 - Legs', 'Day 4 - Push', 'Day 5 - Pull'],
  UPPER_LOWER: ['Day 1 - Upper', 'Day 2 - Lower', 'Day 3 - Upper', 'Day 4 - Lower'],
  BODY_PART_SPLIT: ['Day 1 - Chest', 'Day 2 - Back', 'Day 3 - Shoulders', 'Day 4 - Legs', 'Day 5 - Arms'],
  POWERBUILDING: ['Day 1 - Upper Strength', 'Day 2 - Lower Strength', 'Day 3 - Upper Volume', 'Day 4 - Lower Volume'],
  CUSTOM: ['Day 1'],
};

export default function NewMesocyclePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [buildMode, setBuildMode] = useState<BuildMode>('USE_TEMPLATE');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateDefinition | null>(null);
  const [infoTemplate, setInfoTemplate] = useState<TemplateDefinition | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    totalWeeks: 4,
    templateId: '',
  });
  const [recommendations, setRecommendations] = useState<MesocycleRecommendation | null>(null);
  const [splitType, setSplitType] = useState<SplitType>('UPPER_LOWER');
  const [customDaysCount, setCustomDaysCount] = useState(3);
  const [scratchDays, setScratchDays] = useState<ScratchDay[]>(
    DEFAULT_SPLIT_DAYS.UPPER_LOWER.map((label) => ({ label, primaryMuscle: 'GENERAL', exercises: [] })),
  );
  const [pickerDayIndex, setPickerDayIndex] = useState<number | null>(null);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [exerciseQuery, setExerciseQuery] = useState('');
  const [allExercises, setAllExercises] = useState<Array<{ id: string; name: string; primaryMuscle?: string }>>([]);

  useEffect(() => {
    loadRecommendations();
    loadExercises();
  }, []);

  async function loadRecommendations() {
    try {
      const res = await mesocyclesApi.recommend();
      setRecommendations(res.data as MesocycleRecommendation);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : JSON.stringify(err);
      console.error('Failed to load recommendations:', errorMsg);
    }
  }
  async function loadExercises() {
    try {
      const res = await exercisesApi.findAll();
      const list = Array.isArray(res.data) ? res.data : [];
      setAllExercises(list);
    } catch (err) {
      console.error('Failed to load exercises:', err);
    }
  }

  useEffect(() => {
    if (splitType === 'CUSTOM') {
      setScratchDays(Array.from({ length: customDaysCount }).map((_, index) => ({
        label: `Day ${index + 1}`,
        primaryMuscle: 'GENERAL',
        exercises: [],
      })));
      return;
    }
    setScratchDays(DEFAULT_SPLIT_DAYS[splitType].map((label) => ({ label, primaryMuscle: 'GENERAL', exercises: [] })));
  }, [splitType, customDaysCount]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setLoading(true);
    try {
      const finalTemplateId =
        buildMode === 'USE_TEMPLATE'
          ? (selectedTemplate?.id || formData.templateId || undefined)
          : undefined;
      const result = await mesocyclesApi.generate({
        name: formData.name,
        totalWeeks: formData.totalWeeks,
        templateId: finalTemplateId,
      });
      const scratchPayload =
        buildMode === 'CREATE_FROM_SCRATCH'
          ? {
            splitType,
            weeklyStructure: scratchDays.map((day) => ({
              label: day.label,
              primaryMuscle: day.primaryMuscle,
              exercises: day.exercises.map((item) => item.name),
            })),
          }
          : undefined;
      if (typeof window !== 'undefined' && scratchPayload) {
        sessionStorage.setItem(`mesocycle-draft:${result.data.id}`, JSON.stringify(scratchPayload));
      }
      router.push('/mesocycles');
    } catch (err) {
      console.error('Failed to create mesocycle:', err);
      alert('Failed to create mesocycle');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100dvh', backgroundColor: '#111318', paddingBottom: '96px' }}>
      <AppHeader
        title="Create Block"
        showBack
        backHref="/mesocycles"
      />

      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '0 20px' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Name */}
          <div>
            <label style={{
              display: 'block',
              fontFamily: 'Manrope',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#e2e2e8',
              marginBottom: '8px',
            }}>
              Block Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Strength Phase 1"
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: '#1a1c20',
                border: '1px solid #282a2e',
                borderRadius: '8px',
                color: '#e2e2e8',
                fontFamily: 'Manrope',
                fontSize: '0.875rem',
              }}
              required
            />
          </div>

          {/* Duration */}
          <div>
            <label style={{
              display: 'block',
              fontFamily: 'Manrope',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#e2e2e8',
              marginBottom: '8px',
            }}>
              Duration (weeks)
            </label>
            <select
              value={formData.totalWeeks}
              onChange={(e) => setFormData(prev => ({ ...prev, totalWeeks: parseInt(e.target.value) }))}
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: '#1a1c20',
                border: '1px solid #282a2e',
                borderRadius: '8px',
                color: '#e2e2e8',
                fontFamily: 'Manrope',
                fontSize: '0.875rem',
              }}
            >
              <option value={4}>4 weeks</option>
              <option value={6}>6 weeks</option>
              <option value={8}>8 weeks</option>
              <option value={12}>12 weeks</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontFamily: 'Manrope', fontSize: '0.875rem', fontWeight: 600, color: '#e2e2e8', marginBottom: '8px' }}>
              Build Mode
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button type="button" className="btn-ghost" onClick={() => setBuildMode('USE_TEMPLATE')} style={{ borderColor: buildMode === 'USE_TEMPLATE' ? '#59d8de' : '#282a2e', color: buildMode === 'USE_TEMPLATE' ? '#59d8de' : '#8e909c' }}>
                Use Template
              </button>
              <button type="button" className="btn-ghost" onClick={() => setBuildMode('CREATE_FROM_SCRATCH')} style={{ borderColor: buildMode === 'CREATE_FROM_SCRATCH' ? '#59d8de' : '#282a2e', color: buildMode === 'CREATE_FROM_SCRATCH' ? '#59d8de' : '#8e909c' }}>
                Create From Scratch
              </button>
            </div>
          </div>

          {buildMode === 'USE_TEMPLATE' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <p className="label-sm" style={{ color: '#8e909c' }}>
                Original templates are locked. Selecting one creates an editable copy (exercise + sets only).
              </p>
              {TEMPLATE_CATALOG.map((template) => {
                const selected = selectedTemplate?.id === template.id;
                const focusColor = MUSCLE_FOCUS_COLOR[template.muscleFocus];
                return (
                  <div key={template.id} style={{ position: 'relative', backgroundColor: '#1a1c20', border: selected ? '1px solid #59d8de' : '1px solid #282a2e', borderRadius: '8px', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', backgroundColor: focusColor }} />
                    <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', gap: '8px', padding: '12px 12px 12px 16px' }}>
                      <button type="button" onClick={() => { setSelectedTemplate(template); setFormData((prev) => ({ ...prev, templateId: template.id, totalWeeks: template.durationWeeks })); }} style={{ flex: 1, background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}>
                        <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.95rem', color: '#e2e2e8', fontWeight: 600 }}>{template.programName}</p>
                        <p style={{ fontFamily: 'Manrope', fontSize: '0.75rem', color: '#8e909c' }}>
                          {SPLIT_LABELS[template.splitType]} • {template.weeklyStructure.length} days/week • {template.durationWeeks} weeks
                        </p>
                        <p style={{ fontFamily: 'Manrope', fontSize: '0.7rem', color: '#444650', marginTop: '6px' }}>
                          {template.tags.join(' · ')}
                        </p>
                        {template.highIntensity && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px' }}>
                            <AlertTriangle size={12} color="#ffb4ab" />
                            <span style={{ fontFamily: 'Manrope', fontSize: '0.68rem', color: '#ffb4ab' }}>
                              Not recommended for beginners · High recovery demand
                            </span>
                          </div>
                        )}
                      </button>
                      <button type="button" onClick={() => { setInfoTemplate(template); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', flexShrink: 0 }}>
                        <Info size={16} color="#8e909c" />
                      </button>
                    </div>
                  </div>
                );
              })}
              {recommendations?.rationale && (
                <p style={{ fontFamily: 'Manrope', fontSize: '0.75rem', color: '#8e909c' }}>
                  Recommendation insight: {recommendations.rationale}
                </p>
              )}
            </div>
          )}

          {buildMode === 'CREATE_FROM_SCRATCH' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="label-sm" style={{ color: '#8e909c', marginBottom: '8px', display: 'block' }}>
                  Split Type
                </label>
                <select value={splitType} onChange={(e) => setSplitType(e.target.value as SplitType)} className="k-input">
                  {Object.entries(SPLIT_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              <div style={{ backgroundColor: '#1a1c20', border: '1px solid #282a2e', borderRadius: '8px', padding: '12px' }}>
                <p className="label-sm" style={{ color: '#8e909c', marginBottom: '10px' }}>Weekly Structure</p>
                {splitType === 'CUSTOM' && (
                  <p style={{ fontFamily: 'Manrope', fontSize: '0.72rem', color: '#8e909c', marginBottom: '8px' }}>
                    Barebones setup. Add up to 6 days and assign focus per day.
                  </p>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {scratchDays.map((day, dayIndex) => (
                    <div key={`${day.label}-${dayIndex}`} style={{ position: 'relative', border: '1px solid #282a2e', borderRadius: '8px', padding: '10px' }}>
                      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', borderRadius: '8px 0 0 8px', backgroundColor: MUSCLE_FOCUS_COLOR[(day.primaryMuscle as keyof typeof MUSCLE_FOCUS_COLOR) ?? 'BALANCED'] ?? '#59d8de' }} />
                      <div style={{ marginLeft: '8px' }}>
                        <p style={{ fontFamily: 'Manrope', fontSize: '0.78rem', color: '#e2e2e8', fontWeight: 600 }}>{day.label}</p>
                        <select
                          className="k-input"
                          value={day.primaryMuscle}
                          onChange={(e) => {
                            const primaryMuscle = e.target.value;
                            setScratchDays((prev) => prev.map((current, index) => (
                              index === dayIndex
                                ? { ...current, primaryMuscle, label: buildDayLabel(dayIndex, primaryMuscle, current.exercises) }
                                : current
                            )));
                          }}
                          style={{ marginTop: '6px' }}
                        >
                          <option value="GENERAL">General</option>
                          <option value="CHEST">Chest</option>
                          <option value="BACK">Back</option>
                          <option value="SHOULDERS">Shoulders</option>
                          <option value="QUADS">Quads</option>
                          <option value="GLUTES">Glutes</option>
                        </select>
                      </div>
                      <p style={{ fontFamily: 'Manrope', fontSize: '0.7rem', color: '#8e909c', marginTop: '4px' }}>
                        Exercises: {day.exercises.length > 0 ? day.exercises.map((item) => item.name).join(', ') : 'None yet'}
                      </p>
                      <button type="button" className="btn-ghost" style={{ marginTop: '8px' }} onClick={() => setPickerDayIndex(dayIndex)}>
                        Add Exercise
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  className="btn-ghost"
                  style={{ marginTop: '10px' }}
                  onClick={() => {
                    if (scratchDays.length >= 6) return;
                    setCustomDaysCount((count) => Math.min(6, count + 1));
                    setSplitType('CUSTOM');
                    setScratchDays((prev) => ([
                      ...prev,
                      { label: `Day ${prev.length + 1}`, primaryMuscle: 'GENERAL', exercises: [] },
                    ]));
                  }}
                >
                  + Add Day
                </button>
                <p style={{ fontFamily: 'Manrope', fontSize: '0.68rem', color: '#8e909c', marginTop: '6px' }}>
                  Max 6 days
                </p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !formData.name.trim()}
            style={{
              width: '100%',
              padding: '16px',
              background: loading ? '#444650' : 'linear-gradient(45deg, #b1c5ff, #002560)',
              border: 'none',
              borderRadius: '8px',
              color: loading ? '#8e909c' : '#002c70',
              fontFamily: 'Manrope',
              fontSize: '0.875rem',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '16px',
            }}
          >
            {loading ? 'Creating...' : 'Create Block'}
          </button>
        </form>
      </div>

      {pickerDayIndex !== null && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(12,14,18,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 40 }}>
          <div style={{ width: '100%', maxWidth: '420px', backgroundColor: '#1a1c20', border: '1px solid #282a2e', borderRadius: '10px', padding: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <p style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#e2e2e8', fontSize: '1rem', fontWeight: 600 }}>Add Exercise</p>
              <button type="button" onClick={() => setPickerDayIndex(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={16} color="#8e909c" /></button>
            </div>
            <div style={{ position: 'relative', marginBottom: '8px' }}>
              <Search size={14} color="#8e909c" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
              <input value={exerciseQuery} onChange={(e) => setExerciseQuery(e.target.value)} placeholder="Search exercise" className="k-input" style={{ paddingLeft: '30px' }} />
            </div>
            <select className="k-input" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} style={{ marginBottom: '8px' }}>
              <option value="ALL">All muscle groups</option>
              {[...new Set(allExercises.map((item) => item.primaryMuscle).filter(Boolean))].map((muscle) => (
                <option key={muscle} value={muscle}>{muscle}</option>
              ))}
            </select>
            <div style={{ maxHeight: '240px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {allExercises
                .filter((item) => (categoryFilter === 'ALL' || item.primaryMuscle === categoryFilter)
                  && item.name.toLowerCase().includes(exerciseQuery.toLowerCase()))
                .slice(0, 40)
                .map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setScratchDays((prev) => prev.map((day, index) => {
                        if (index !== pickerDayIndex) return day;
                        const nextExercises = [...day.exercises, { id: item.id, name: item.name, primaryMuscle: item.primaryMuscle }];
                        return {
                          ...day,
                          exercises: nextExercises,
                          label: buildDayLabel(index, day.primaryMuscle, nextExercises),
                        };
                      }));
                      setPickerDayIndex(null);
                    }}
                    style={{ backgroundColor: '#111318', border: '1px solid #282a2e', borderRadius: '8px', padding: '8px', textAlign: 'left', cursor: 'pointer' }}
                  >
                    <p style={{ fontFamily: 'Manrope', color: '#e2e2e8', fontSize: '0.82rem', margin: 0 }}>{item.name}</p>
                    <p style={{ fontFamily: 'Manrope', color: '#8e909c', fontSize: '0.68rem', margin: 0 }}>{item.primaryMuscle ?? 'General'}</p>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}

      {infoTemplate && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(12,14,18,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 50 }}>
          <div style={{ width: '100%', maxWidth: '430px', backgroundColor: '#1a1c20', border: '1px solid #282a2e', borderRadius: '10px', padding: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <p style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#e2e2e8', fontSize: '1rem', fontWeight: 700 }}>{infoTemplate.programName}</p>
              <button type="button" onClick={() => setInfoTemplate(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <X size={16} color="#8e909c" />
              </button>
            </div>
            <p style={{ fontFamily: 'Manrope', color: '#8e909c', fontSize: '0.8rem', marginBottom: '8px' }}>{infoTemplate.overview}</p>
            <p style={{ fontFamily: 'Manrope', color: '#e2e2e8', fontSize: '0.75rem' }}>Split: {SPLIT_LABELS[infoTemplate.splitType]}</p>
            <p style={{ fontFamily: 'Manrope', color: '#e2e2e8', fontSize: '0.75rem' }}>Duration: {infoTemplate.durationWeeks} weeks</p>
            <p style={{ fontFamily: 'Manrope', color: '#e2e2e8', fontSize: '0.75rem' }}>Muscle focus: {infoTemplate.muscleFocus}</p>
            <p style={{ fontFamily: 'Manrope', color: '#e2e2e8', fontSize: '0.75rem', marginBottom: '6px' }}>
              Deload: Week {infoTemplate.deloadWeek} uses reduced set count and lower intensity.
            </p>
            <p className="label-sm" style={{ color: '#8e909c', marginBottom: '6px' }}>Weekly Structure</p>
            {infoTemplate.weeklyStructure.map((day) => (
              <p key={day.label} style={{ fontFamily: 'Manrope', color: '#8e909c', fontSize: '0.7rem', margin: '0 0 4px' }}>
                {day.label}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function buildDayLabel(dayIndex: number, primaryMuscle: string, exercises: ScratchExercise[]) {
  const display = (value: string) => value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
  const relatedMuscles = [...new Set(exercises.map((item) => item.primaryMuscle).filter(Boolean))] as string[];
  const secondary = relatedMuscles
    .filter((muscle) => muscle !== primaryMuscle && muscle !== 'GENERAL')
    .slice(0, 2)
    .map(display);
  const primary = primaryMuscle === 'GENERAL' ? `Day ${dayIndex + 1}` : display(primaryMuscle);
  if (secondary.length === 0) return `Day ${dayIndex + 1} - ${primary}`;
  return `Day ${dayIndex + 1} - ${primary} & ${secondary.join(' & ')}`;
}