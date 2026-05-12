'use client';

import { Suspense, useEffect, useRef, useState, type CSSProperties } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import { mesocyclesApi } from '@/lib/api/mesocycles';
import { ApiError } from '@/lib/api/client';
import { templatesApi, type TemplateDetail, type TemplateListItem } from '@/lib/api/templates';
import { AlertTriangle, Info, Search, X } from 'lucide-react';
import { exercisesApi } from '@/lib/api/exercises';

type BuildMode = 'USE_TEMPLATE' | 'CREATE_FROM_SCRATCH';
type ScratchExercise = { id: string; name: string; primaryMuscle?: string };
type ScratchDay = { label: string; primaryMuscle: string; exercises: ScratchExercise[] };
type SplitType =
  | 'FULL_BODY'
  | 'PPL'
  | 'UPPER_LOWER'
  | 'BODY_PART_SPLIT'
  | 'POWERBUILDING'
  | 'CUSTOM';

type TemplateCard = TemplateListItem & { detail?: TemplateDetail | null };

const SPLIT_LABELS: Record<SplitType, string> = {
  FULL_BODY: 'Full Body',
  PPL: 'Push Pull Legs',
  UPPER_LOWER: 'Upper Lower',
  BODY_PART_SPLIT: 'Bodybuilding / Hypertrophy',
  POWERBUILDING: 'Powerbuilding',
  CUSTOM: 'Custom Split',
};

const sectionLabelStyle: CSSProperties = {
  display: 'block',
  fontFamily: 'Manrope, sans-serif',
  fontSize: '0.57rem',
  letterSpacing: '0.22em',
  textTransform: 'uppercase',
  color: '#8e909c',
  fontWeight: 700,
};
//defining  styling 
const inputFieldStyle: CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  backgroundColor: '#161820',
  border: '1px solid #3a3c44',
  borderRadius: '12px',
  color: '#e2e2e8',
  fontFamily: 'Manrope, sans-serif',
  fontSize: '14px',
};

const primaryGradient = 'linear-gradient(135deg, #b1c5ff 0%, #3a5cbf 100%)';

const DEFAULT_SPLIT_DAYS: Record<SplitType, string[]> = {
  FULL_BODY: ['Day 1 - Full Body', 'Day 2 - Full Body', 'Day 3 - Full Body'],
  PPL: ['Day 1 - Push', 'Day 2 - Pull', 'Day 3 - Legs', 'Day 4 - Push', 'Day 5 - Pull'],
  UPPER_LOWER: ['Day 1 - Upper', 'Day 2 - Lower', 'Day 3 - Upper', 'Day 4 - Lower'],
  BODY_PART_SPLIT: ['Day 1 - Chest', 'Day 2 - Back', 'Day 3 - Shoulders', 'Day 4 - Legs', 'Day 5 - Arms'],
  POWERBUILDING: ['Day 1 - Upper Strength', 'Day 2 - Lower Strength', 'Day 3 - Upper Volume', 'Day 4 - Lower Volume'],
  CUSTOM: ['Day 1'],
};

export default function NewMesocyclePage() {
  return (
    <Suspense fallback={<NewMesocycleLoadingState />}>
      <MesocyclesNewInner />
    </Suspense>
  );
}

function parseTemplateDurationWeeks(template: TemplateCard): number {
  const raw = template.durationWeeks as string | number | undefined;
  const str = raw === undefined || raw === null ? '8' : String(raw);
  const first = str.split(/[–-]/)[0]?.trim() ?? str;
  const n = Number.parseInt(first, 10);
  return Number.isNaN(n) ? 8 : n;
}

function MesocyclesNewInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlTemplateIdParam = searchParams.get('templateId');
  const [loading, setLoading] = useState(false);
  const [buildMode, setBuildMode] = useState<BuildMode>('USE_TEMPLATE');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateCard | null>(null);
  const [infoTemplate, setInfoTemplate] = useState<TemplateCard | null>(null);
  const [templates, setTemplates] = useState<TemplateCard[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    totalWeeks: 4,
    templateId: '',
  });
  const [recommendationRationale, setRecommendationRationale] = useState<string | null>(null);
  const [splitType, setSplitType] = useState<SplitType>('UPPER_LOWER');
  const [customDaysCount, setCustomDaysCount] = useState(3);
  const [scratchDays, setScratchDays] = useState<ScratchDay[]>(
    DEFAULT_SPLIT_DAYS.UPPER_LOWER.map((label) => ({ label, primaryMuscle: 'GENERAL', exercises: [] })),
  );
  const [pickerDayIndex, setPickerDayIndex] = useState<number | null>(null);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [exerciseQuery, setExerciseQuery] = useState('');
  const [allExercises, setAllExercises] = useState<Array<{ id: string; name: string; primaryMuscle?: string }>>([]);
  const [urlPreselectedTemplateId, setUrlPreselectedTemplateId] = useState<string | null>(null);
  const selectedTemplateCardRef = useRef<HTMLDivElement | null>(null);

  function applyTemplateSelection(template: TemplateCard) {
    const durationWeeks = parseTemplateDurationWeeks(template);
    setSelectedTemplate(template);
    setFormData((prev) => ({
      ...prev,
      templateId: template.id,
      totalWeeks: Number.isNaN(durationWeeks) ? prev.totalWeeks : durationWeeks,
    }));
    setBuildMode('USE_TEMPLATE');
  }

  useEffect(() => {
    loadRecommendations();
    loadExercises();
  }, []);

  async function loadRecommendations() {
    try {
      const [recommendedRes, templatesRes] = await Promise.all([
        templatesApi.recommended(),
        templatesApi.all(),
      ]);
      const allTemplates = Array.isArray(templatesRes.data)
        ? (templatesRes.data as TemplateListItem[])
        : [];
      setTemplates(allTemplates);
      const recommendedTemplate = (recommendedRes.data?.recommended ??
        null) as TemplateDetail | null;
      const rationale = (recommendedRes.data?.rationale ?? null) as string | null;
      setRecommendationRationale(rationale);
      const urlTemplateIdAfterFetch =
        typeof window !== 'undefined'
          ? new URL(window.location.href).searchParams.get('templateId')
          : urlTemplateIdParam;
      if (!urlTemplateIdAfterFetch && recommendedTemplate) {
        applyTemplateSelection(recommendedTemplate);
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        return;
      }
      const errorMsg = err instanceof Error ? err.message : JSON.stringify(err);
      console.error('Failed to load recommendations:', errorMsg);
    }
  }

  useEffect(() => {
    if (!urlTemplateIdParam || templates.length === 0) return;
    const match = templates.find((t) => t.id === urlTemplateIdParam);
    if (!match) return;
    const durationWeeks = parseTemplateDurationWeeks(match);
    setSelectedTemplate(match);
    setFormData((prev) => ({
      ...prev,
      name: match.name || prev.name,
      templateId: match.id,
      totalWeeks: Number.isNaN(durationWeeks) ? prev.totalWeeks : durationWeeks,
    }));
    setBuildMode('USE_TEMPLATE');
    setUrlPreselectedTemplateId(match.id);
  }, [urlTemplateIdParam, templates]);

  useEffect(() => {
    if (!urlPreselectedTemplateId || selectedTemplate?.id !== urlPreselectedTemplateId) return;
    selectedTemplateCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [selectedTemplate?.id, urlPreselectedTemplateId]);

  async function loadExercises() {
    try {
      const res = await exercisesApi.findAll();
      const list = Array.isArray(res.data) ? res.data : [];
      setAllExercises(list);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setAllExercises([]);
        return;
      }
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
      if (err instanceof ApiError && err.status === 401) {
        return;
      }
      console.error('Failed to create mesocycle:', err);
      alert('Failed to create mesocycle');
    } finally {
      setLoading(false);
    }
  }

  const showSubmitButton = !!selectedTemplate;

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
            <label style={{ ...sectionLabelStyle, marginBottom: '8px' }}>
              Block Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Strength Phase 1"
              style={inputFieldStyle}
              required
            />
          </div>

          {/* Duration */}
          <div>
            <label style={{ ...sectionLabelStyle, marginBottom: '8px' }}>
              Duration (weeks)
            </label>
            <select
              value={formData.totalWeeks}
              onChange={(e) => setFormData(prev => ({ ...prev, totalWeeks: parseInt(e.target.value) }))}
              style={inputFieldStyle}
            >
              <option value={4}>4 weeks</option>
              <option value={6}>6 weeks</option>
              <option value={8}>8 weeks</option>
              <option value={12}>12 weeks</option>
            </select>
          </div>

          <div>
            <label style={{ ...sectionLabelStyle, marginBottom: '8px' }}>
              Build Mode
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '4px',
              padding: '4px',
              backgroundColor: '#161820',
              border: '1px solid #3a3c44',
              borderRadius: '14px',
            }}>
              <button
                type="button"
                onClick={() => setBuildMode('USE_TEMPLATE')}
                style={{
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: buildMode === 'USE_TEMPLATE' ? 'none' : '1px solid #3a3c44',
                  background: buildMode === 'USE_TEMPLATE' ? primaryGradient : 'transparent',
                  color: buildMode === 'USE_TEMPLATE' ? '#05080f' : '#c5c6d2',
                  fontFamily: buildMode === 'USE_TEMPLATE' ? "'Space Grotesk', sans-serif" : 'Manrope, sans-serif',
                  fontWeight: buildMode === 'USE_TEMPLATE' ? 900 : 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  width: '100%',
                }}
              >
                Use Template
              </button>
              <button
                type="button"
                onClick={() => setBuildMode('CREATE_FROM_SCRATCH')}
                style={{
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: buildMode === 'CREATE_FROM_SCRATCH' ? 'none' : '1px solid #3a3c44',
                  background: buildMode === 'CREATE_FROM_SCRATCH' ? primaryGradient : 'transparent',
                  color: buildMode === 'CREATE_FROM_SCRATCH' ? '#05080f' : '#c5c6d2',
                  fontFamily: buildMode === 'CREATE_FROM_SCRATCH' ? "'Space Grotesk', sans-serif" : 'Manrope, sans-serif',
                  fontWeight: buildMode === 'CREATE_FROM_SCRATCH' ? 900 : 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  width: '100%',
                }}
              >
                Create From Scratch
              </button>
            </div>
          </div>

          {buildMode === 'USE_TEMPLATE' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <p className="label-sm" style={{ color: '#8e909c' }}>
                Original templates are locked. Selecting one creates an editable copy (exercise + sets only).
              </p>
              {templates.map((template) => {
                const selected = selectedTemplate?.id === template.id;
                const focusColor = selected ? '#59d8de' : '#b1c5ff';
                const splitTypeValue =
                  (template.splitStyle as SplitType) in SPLIT_LABELS
                    ? (template.splitStyle as SplitType)
                    : null;
                return (
                  <div
                    key={template.id}
                    ref={selected ? selectedTemplateCardRef : null}
                    style={{
                      position: 'relative',
                      backgroundColor: '#1e2026',
                      border: selected ? '1.5px solid var(--primary)' : '1px solid #3a3c44',
                      borderLeft: `3px solid ${focusColor}`,
                      borderRadius: '16px',
                      overflow: 'hidden',
                      boxShadow: 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', gap: '8px', padding: '16px 16px 14px 18px' }}>
                      <button type="button" onClick={() => applyTemplateSelection(template)} style={{ flex: 1, background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}>
                        <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 'clamp(1.1rem,4vw,1.3rem)', color: '#e2e2e8', fontWeight: 800, letterSpacing: '-0.035em' }}>{template.name}</p>
                        <p style={{ fontFamily: 'Manrope', fontSize: '0.75rem', color: '#8e909c' }}>
                          {(splitTypeValue ? SPLIT_LABELS[splitTypeValue] : template.splitStyleLabel)} • {template.daysPerWeek} days/week • {template.durationWeeks} weeks
                        </p>
                        <p style={{ fontFamily: 'Manrope', fontSize: '0.7rem', color: '#8e909c', marginTop: '6px' }}>
                          {template.goal} · {template.level}
                        </p>
                        {template.difficultyWarning && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px' }}>
                            <AlertTriangle size={12} color="#ffb4ab" />
                            <span style={{ fontFamily: 'Manrope', fontSize: '0.68rem', color: '#ffb4ab' }}>
                              {template.difficultyWarning}
                            </span>
                          </div>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const res = await templatesApi.findOne(template.id);
                            setInfoTemplate({ ...template, detail: res.data as TemplateDetail });
                          } catch (err) {
                            if (err instanceof ApiError && err.status === 401) return;
                            setInfoTemplate(template);
                          }
                        }}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', flexShrink: 0 }}
                      >
                        <Info size={16} color="#8e909c" />
                      </button>
                    </div>
                  </div>
                );
              })}
              {recommendationRationale && (
                <p style={{ fontFamily: 'Manrope', fontSize: '0.75rem', color: '#8e909c' }}>
                  Recommendation insight: {recommendationRationale}
                </p>
              )}
            </div>
          )}

          {buildMode === 'CREATE_FROM_SCRATCH' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ ...sectionLabelStyle, marginBottom: '8px' }}>
                  Split Type
                </label>
                <select
                  value={splitType}
                  onChange={(e) => setSplitType(e.target.value as SplitType)}
                  style={inputFieldStyle}
                >
                  {Object.entries(SPLIT_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              <div style={{ backgroundColor: '#1e2026', border: '1px solid #3a3c44', borderRadius: '16px', padding: '16px' }}>
                <p style={{ ...sectionLabelStyle, marginBottom: '10px', marginTop: 0 }}>Weekly Structure</p>
                {splitType === 'CUSTOM' && (
                  <p style={{ fontFamily: 'Manrope', fontSize: '0.72rem', color: '#8e909c', marginBottom: '8px' }}>
                    Barebones setup. Add up to 6 days and assign focus per day.
                  </p>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {scratchDays.map((day, dayIndex) => (
                    <div
                      key={`${day.label}-${dayIndex}`}
                      style={{
                        position: 'relative',
                        backgroundColor: '#161820',
                        borderLeft: '3px solid #59d8de',
                        borderRadius: '12px',
                        padding: '12px 14px',
                      }}
                    >
                      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 0, opacity: 0, pointerEvents: 'none' }} />
                      <div style={{ marginLeft: 0 }}>
                        <p style={{ fontFamily: 'Manrope', fontSize: '0.78rem', color: '#e2e2e8', fontWeight: 600 }}>{day.label}</p>
                        <select
                          value={day.primaryMuscle}
                          onChange={(e) => {
                            const primaryMuscle = e.target.value;
                            setScratchDays((prev) => prev.map((current, index) => (
                              index === dayIndex
                                ? { ...current, primaryMuscle, label: buildDayLabel(dayIndex, primaryMuscle, current.exercises) }
                                : current
                            )));
                          }}
                          style={{ ...inputFieldStyle, marginTop: '6px' }}
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
                  style={{
                    marginTop: '10px',
                    width: '100%',
                    padding: '12px 16px',
                    background: 'transparent',
                    border: '1px solid #3a3c44',
                    borderRadius: '10px',
                    color: '#c5c6d2',
                    fontFamily: 'Manrope, sans-serif',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
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

          {/* Submit */}
          {showSubmitButton && (
            <div>
              <button
                type="submit"
                disabled={loading || !formData.name.trim()}
                style={{
                  width: '100%',
                  padding: '15px 0',
                  background: loading ? '#444650' : primaryGradient,
                  border: 'none',
                  borderRadius: '14px',
                  color: loading ? '#8e909c' : '#05080f',
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: '15px',
                  fontWeight: 900,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  marginTop: '16px',
                }}
              >
                {loading ? 'Creating...' : 'Create Block'}
              </button>
            </div>
          )}
        </form>
      </div>

      {pickerDayIndex !== null && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(12,14,18,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 40 }}>
          <div style={{ width: '100%', maxWidth: '420px', backgroundColor: '#1e2026', border: '1px solid #3a3c44', borderRadius: '16px', padding: '12px' }}>
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
                    style={{ backgroundColor: '#161820', border: '1px solid #3a3c44', borderRadius: '10px', padding: '8px', textAlign: 'left', cursor: 'pointer' }}
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
          <div style={{ width: '100%', maxWidth: '430px', backgroundColor: '#1e2026', border: '1px solid #3a3c44', borderRadius: '16px', padding: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <p style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#e2e2e8', fontSize: '1rem', fontWeight: 700 }}>{infoTemplate.name}</p>
              <button type="button" onClick={() => setInfoTemplate(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <X size={16} color="#8e909c" />
              </button>
            </div>
            <p style={{ fontFamily: 'Manrope', color: '#8e909c', fontSize: '0.8rem', marginBottom: '8px' }}>
              {infoTemplate.detail?.description ?? 'Program template from canonical API source.'}
            </p>
            <p style={{ fontFamily: 'Manrope', color: '#e2e2e8', fontSize: '0.75rem' }}>Split: {infoTemplate.splitStyleLabel}</p>
            <p style={{ fontFamily: 'Manrope', color: '#e2e2e8', fontSize: '0.75rem' }}>Duration: {infoTemplate.durationWeeks} weeks</p>
            <p style={{ fontFamily: 'Manrope', color: '#e2e2e8', fontSize: '0.75rem' }}>Primary focus: {infoTemplate.primaryFocus}</p>
            <p className="label-sm" style={{ color: '#8e909c', marginBottom: '6px' }}>Weekly Structure</p>
            {(infoTemplate.detail?.splitConfigs ?? []).flatMap((split) => split.days).map((day) => (
              <p key={`${day.dayNumber}-${day.label}`} style={{ fontFamily: 'Manrope', color: '#8e909c', fontSize: '0.7rem', margin: '0 0 4px' }}>
                {`Day ${day.dayNumber} - ${day.label}`}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function NewMesocycleLoadingState() {
  return (
    <div style={{ minHeight: '100dvh', backgroundColor: '#111318', paddingBottom: '96px' }}>
      <AppHeader title="Create Block" showBack backHref="/mesocycles" />
      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '20px' }}>
        <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', color: '#8e909c' }}>
          Loading...
        </p>
      </div>
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