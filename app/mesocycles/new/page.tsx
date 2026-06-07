'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import {
  MesocycleExplainerInline,
  MESO_EXPLAINER_STORAGE_KEY,
} from '@/components/MesocycleExplainer';
import { mesocyclesApi } from '@/lib/api/mesocycles';
import { templatesApi, type TemplateDetail, type TemplateListItem } from '@/lib/api/templates';
import { ApiError } from '@/lib/api/client';

const STATIC_FILTERS = ['All Goals', 'Hypertrophy', 'Strength', 'Powerbuilding', 'Full Body'];

const MATRIX_OPTIONS: Record<string, string[]> = {
  Experience: ['Any', 'Beginner', 'Intermediate', 'Advanced'],
  Duration: ['Any', '≤6w', '6–8w', '8–12w', '12w+'],
  'Days/Week': ['Any', '3', '4', '5', '6+'],
  Equipment: ['Any', 'Full Gym', 'Minimal', 'Bodyweight'],
};

const STATIC_MODAL_PHASES = [
  { label: 'Phase 01 [W1–3]', title: 'Volume Accumulation', accent: false },
  { label: 'Phase 02 [W4–6]', title: 'Intensification', accent: false },
  { label: 'Phase 03 [W7–8]', title: 'Deload & Retest', accent: true },
];

const C = {
  primary: '#b1c5ff',
  secondary: '#d4bbff',
  tertiary: '#59d8de',
  surface: '#111318',
  surfaceLow: '#161820',
  surfaceContainer: '#1e2026',
  surfaceHigh: '#282a30',
  surfaceHighest: '#32343c',
  outline: '#8e909c',
  outlineVariant: '#3a3c44',
  onSurface: '#e2e2e8',
  onSurfaceVariant: '#c5c6d2',
};

const ACCENT: Record<string, string> = {
  primary: C.primary,
  secondary: C.secondary,
  tertiary: C.tertiary,
};

const DAY_COLORS = [C.primary, C.tertiary, C.secondary, '#a2e7ff'];

const DURATION_PRESETS = [4, 8] as const;
const MIN_CUSTOM_WEEKS = 2;
const MAX_CUSTOM_WEEKS = 16;

function rgb(hex: string) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r ? `${parseInt(r[1], 16)},${parseInt(r[2], 16)},${parseInt(r[3], 16)}` : '177,197,255';
}

type Template = {
  id: string;
  name: string;
  tag: string;
  badge: string | null;
  goal: string;
  experience: string;
  durationWeeks: number;
  frequencyPerWeek: number;
  splitType: string;
  accentKey: 'primary' | 'secondary' | 'tertiary';
  description: string;
  days: string[];
  stats: Array<{ label: string; value: string }>;
  featured: boolean;
};

function mapApiTemplate(template: TemplateListItem): Template {
  const accentKey =
    template.goal.toLowerCase().includes('strength')
      ? 'secondary'
      : template.goal.toLowerCase().includes('power')
        ? 'tertiary'
        : 'primary';

  return {
    id: template.id,
    name: template.name,
    tag: template.primaryFocus,
    badge: template.badge,
    goal: template.goal,
    experience: template.level,
    durationWeeks: parseInt(template.durationWeeks.split('–')[0] ?? template.durationWeeks, 10) || 8,
    frequencyPerWeek: template.daysPerWeek,
    splitType: template.splitStyle,
    accentKey,
    description: template.difficultyWarning
      ? `${template.progressionType}. ${template.difficultyWarning}`
      : `${template.progressionType} template.`,
    days: template.days,
    stats: template.stats,
    featured: template.featured,
  };
}

function parseTemplateDurationWeeks(template: Template): number {
  return template.durationWeeks;
}

function sessionCount(daysPerWeek: number, totalWeeks: number): number {
  return daysPerWeek * totalWeeks;
}

function derivePreviewRpe(repRangeMin: number, repRangeMax: number): string {
  const mid = (repRangeMin + repRangeMax) / 2;
  if (mid <= 6) return '8.5';
  if (mid <= 9) return '8';
  if (mid <= 12) return '7.5';
  return '7';
}

function clampWeeks(value: number): number {
  return Math.min(MAX_CUSTOM_WEEKS, Math.max(MIN_CUSTOM_WEEKS, value));
}

export default function NewMesocyclePage() {
  return (
    <Suspense fallback={<NewMesocycleLoadingState />}>
      <MesocyclesNewInner />
    </Suspense>
  );
}

function MesocyclesNewInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlTemplateId = searchParams.get('templateId');

  const [step, setStep] = useState<'choose' | 'configure'>('choose');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [modalTemplate, setModalTemplate] = useState<Template | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All Goals');
  const [matrixFilters, setMatrixFilters] = useState<Record<string, string>>({
    Experience: 'Any',
    Duration: 'Any',
    'Days/Week': 'Any',
    Equipment: 'Any',
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [blockName, setBlockName] = useState('');
  const [totalWeeks, setTotalWeeks] = useState(8);
  const [durationMode, setDurationMode] = useState<'preset' | 'custom'>('preset');
  const [showCustomStepper, setShowCustomStepper] = useState(false);
  const [showExplainer, setShowExplainer] = useState(false);
  const [templateDetailsCache, setTemplateDetailsCache] = useState<Record<string, TemplateDetail>>({});
  const [detailLoadingId, setDetailLoadingId] = useState<string | null>(null);
  const [recommendationRationale, setRecommendationRationale] = useState<string | null>(null);

  const dismissExplainer = useCallback(() => {
    localStorage.setItem(MESO_EXPLAINER_STORAGE_KEY, 'true');
    setShowExplainer(false);
  }, []);

  useEffect(() => {
    setShowExplainer(localStorage.getItem(MESO_EXPLAINER_STORAGE_KEY) !== 'true');
  }, []);

  useEffect(() => {
    if (!modalTemplate) return;
    const templateId = modalTemplate.id;
    if (templateDetailsCache[templateId]) return;

    let cancelled = false;
    setDetailLoadingId(templateId);
    templatesApi.findOne(templateId)
      .then((res) => {
        if (cancelled) return;
        setTemplateDetailsCache((prev) => ({ ...prev, [templateId]: res.data as TemplateDetail }));
      })
      .catch(() => { /* modal falls back to day labels only */ })
      .finally(() => {
        if (!cancelled) setDetailLoadingId(null);
      });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- fetch once per modal template id
  }, [modalTemplate?.id]);

  const closeModal = useCallback(() => setModalTemplate(null), []);

  function cycleMatrix(label: string) {
    const options = MATRIX_OPTIONS[label] ?? ['Any'];
    const current = matrixFilters[label] ?? 'Any';
    const next = options[(options.indexOf(current) + 1) % options.length] ?? 'Any';
    setMatrixFilters((prev) => ({ ...prev, [label]: next }));
  }

  function selectPresetWeeks(w: number) {
    setDurationMode('preset');
    setShowCustomStepper(false);
    setTotalWeeks(w);
  }

  function openCustomStepper() {
    setShowCustomStepper(true);
    setDurationMode('custom');
    const initial = DURATION_PRESETS.includes(totalWeeks as typeof DURATION_PRESETS[number]) ? 10 : clampWeeks(totalWeeks);
    setTotalWeeks(initial);
  }

  function stepCustomWeeks(delta: number) {
    setDurationMode('custom');
    setTotalWeeks((prev) => clampWeeks(prev + delta));
    setShowCustomStepper(false);
  }

  function dismissCustomWeeks() {
    setDurationMode('preset');
    setShowCustomStepper(false);
    setTotalWeeks(8);
  }

  function selectTemplate(template: Template) {
    setSelectedTemplate(template);
    setBlockName(template.name);
    setTotalWeeks(parseTemplateDurationWeeks(template));
    setDurationMode('preset');
    setShowCustomStepper(false);
    setStep('configure');
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([templatesApi.recommended(), templatesApi.all()])
      .then(([recRes, allRes]) => {
        if (cancelled) return;
        const list = Array.isArray(allRes.data) ? (allRes.data as TemplateListItem[]) : [];
        setTemplates(list.map(mapApiTemplate));
        const rationale = (recRes.data?.rationale ?? null) as string | null;
        setRecommendationRationale(rationale);
      })
      .catch(() => {
        if (!cancelled) setTemplates([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!urlTemplateId || templates.length === 0) return;
    const match = templates.find((t) => t.id === urlTemplateId);
    if (match) selectTemplate(match);
  }, [urlTemplateId, templates]);

  async function handleCreate() {
    if (!selectedTemplate || !blockName.trim() || submitting) return;
    setSubmitting(true);
    try {
      await mesocyclesApi.generate({
        name: blockName.trim(),
        totalWeeks,
        templateId: selectedTemplate.id,
      });
      router.push('/dashboard');
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return;
      console.error('Failed to create mesocycle:', err);
      alert('Failed to create block');
    } finally {
      setSubmitting(false);
    }
  }

  const filtered = templates
    .filter((t) => activeFilter === 'All Goals' || t.goal.toLowerCase().includes(activeFilter.toLowerCase()))
    .filter((t) => search.trim().length === 0 || `${t.name} ${t.tag} ${t.goal}`.toLowerCase().includes(search.toLowerCase()))
    .filter((t) => {
      const exp = matrixFilters['Experience'] ?? 'Any';
      if (exp !== 'Any' && !t.experience.toLowerCase().includes(exp.toLowerCase())) return false;
      const dur = matrixFilters['Duration'] ?? 'Any';
      if (dur !== 'Any') {
        const w = t.durationWeeks;
        if (dur === '≤6w' && w > 6) return false;
        if (dur === '6–8w' && (w < 6 || w > 8)) return false;
        if (dur === '8–12w' && (w <= 8 || w > 12)) return false;
        if (dur === '12w+' && w <= 12) return false;
      }
      const days = matrixFilters['Days/Week'] ?? 'Any';
      if (days !== 'Any') {
        const freq = t.frequencyPerWeek;
        if (days === '6+' ? freq < 6 : freq !== parseInt(days, 10)) return false;
      }
      return true;
    });

  const featured = filtered.find((t) => t.featured) ?? filtered[0];
  const rest = filtered.filter((t) => t.id !== featured?.id);

  if (step === 'configure' && selectedTemplate) {
    const sessions = sessionCount(selectedTemplate.frequencyPerWeek, totalWeeks);
    return (
      <div style={{ minHeight: '100dvh', backgroundColor: C.surface, paddingBottom: 96 }}>
        <AppHeader title="Configure Block" showBack backHref="/mesocycles" />
        <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 20px' }}>
          <div style={{
            background: C.surfaceContainer,
            border: `1px solid ${C.outlineVariant}`,
            borderLeft: `3px solid ${ACCENT[selectedTemplate.accentKey]}`,
            borderRadius: 16,
            padding: '16px 18px',
            marginBottom: 24,
          }}>
            <p style={{ margin: '0 0 4px', fontSize: '0.57rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: ACCENT[selectedTemplate.accentKey], fontWeight: 700 }}>
              {selectedTemplate.tag}
            </p>
            <h2 style={{ margin: '0 0 8px', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 900, fontSize: 20, letterSpacing: '-0.04em', color: C.onSurface }}>
              {selectedTemplate.name}
            </h2>
            <p style={{ margin: '0 0 12px', fontSize: 13, color: C.onSurfaceVariant, fontWeight: 500 }}>
              {selectedTemplate.frequencyPerWeek} days/week · {selectedTemplate.experience}
            </p>
            <button
              type="button"
              onClick={() => setStep('choose')}
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'Manrope, sans-serif', fontSize: 12, fontWeight: 700, color: C.primary }}
            >
              Change program →
            </button>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: '0.57rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: C.outline, fontWeight: 700, marginBottom: 8 }}>
              Block Name
            </label>
            <input
              type="text"
              value={blockName}
              onChange={(e) => setBlockName(e.target.value)}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                background: C.surfaceLow,
                border: `1px solid ${C.outlineVariant}`,
                borderRadius: 12,
                padding: '14px 16px',
                color: C.onSurface,
                fontFamily: 'Manrope, sans-serif',
                fontSize: 13,
                outline: 'none',
              }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: '0.57rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: C.outline, fontWeight: 700, marginBottom: 8 }}>
              Duration
            </label>
            <DurationPicker
              totalWeeks={totalWeeks}
              durationMode={durationMode}
              showCustomStepper={showCustomStepper}
              onSelectPreset={selectPresetWeeks}
              onOpenCustom={openCustomStepper}
              onStepCustom={stepCustomWeeks}
              onDismissCustom={dismissCustomWeeks}
            />
          </div>

          <div style={{
            background: C.surfaceLow,
            border: `1px solid ${C.outlineVariant}`,
            borderRadius: 12,
            padding: '12px 14px',
            marginBottom: 24,
          }}>
            <p style={{ margin: 0, fontFamily: 'Manrope, sans-serif', fontSize: 13, fontWeight: 500, color: C.onSurfaceVariant }}>
              This will create <strong style={{ color: C.onSurface }}>{sessions} sessions</strong> over <strong style={{ color: C.onSurface }}>{totalWeeks} weeks</strong>
            </p>
          </div>

          <button
            type="button"
            onClick={handleCreate}
            disabled={submitting || !blockName.trim()}
            style={{
              width: '100%',
              padding: '15px 0',
              borderRadius: 14,
              border: 'none',
              background: submitting ? C.surfaceHigh : `linear-gradient(135deg, ${C.primary} 0%, #3a5cbf 100%)`,
              color: submitting ? C.outline : '#05080f',
              fontFamily: 'Space Grotesk, sans-serif',
              fontWeight: 900,
              fontSize: 15,
              cursor: submitting || !blockName.trim() ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting ? 'Creating...' : 'Create Block →'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100dvh', backgroundColor: C.surface, color: C.onSurface, fontFamily: 'Manrope, sans-serif', paddingBottom: 110 }}>
      <AppHeader title="Choose Program" showBack backHref="/mesocycles" />

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '26px 16px 0' }}>
        {showExplainer && (
          <MesocycleExplainerInline onDismiss={dismissExplainer} />
        )}
        <p style={{ margin: '0 0 6px', color: C.outline, fontSize: '0.57rem', letterSpacing: '0.24em', textTransform: 'uppercase', fontWeight: 700 }}>
          Programme Selection
        </p>
        <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 900, fontSize: 'clamp(1.85rem,6vw,2.4rem)', letterSpacing: '-0.045em', lineHeight: 1.05, color: C.onSurface, margin: '0 0 10px' }}>
          Choose your program
        </h1>
        <p style={{ color: C.onSurfaceVariant, fontSize: 13, lineHeight: 1.6, fontWeight: 500, margin: '0 0 22px' }}>
          Proven split architectures — each one seeds a full training block with auto-generated volume targets and progression logic.
        </p>

        <div style={{ position: 'relative', marginBottom: 14 }}>
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}>
            <SearchIcon size={16} color={C.outline} />
          </span>
          <input
            placeholder="Search programs…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              background: C.surfaceLow,
              border: `1px solid ${C.outlineVariant}`,
              borderRadius: 12,
              padding: '12px 14px 12px 40px',
              color: C.onSurface,
              fontFamily: 'Manrope, sans-serif',
              fontSize: 14,
              outline: 'none',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginBottom: 12 }}>
          {STATIC_FILTERS.map((label) => {
            const active = label === activeFilter;
            return (
              <button key={label} onClick={() => setActiveFilter(label)} style={{
                flexShrink: 0,
                padding: '7px 16px',
                borderRadius: 100,
                border: active ? 'none' : `1px solid ${C.outlineVariant}`,
                background: active ? C.primary : 'transparent',
                color: active ? '#05080f' : C.onSurfaceVariant,
                fontSize: '0.72rem',
                fontFamily: 'Manrope, sans-serif',
                fontWeight: 700,
                cursor: 'pointer',
              }}>
                {label}
              </button>
            );
          })}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 28 }}>
          {Object.keys(MATRIX_OPTIONS).map((label) => {
            const value = matrixFilters[label] ?? 'Any';
            const active = value !== 'Any';
            return (
              <button key={label} onClick={() => cycleMatrix(label)} style={{
                background: active ? `rgba(${rgb(C.primary)},0.1)` : C.surfaceLow,
                borderRadius: 8,
                padding: '8px 10px',
                display: 'flex',
                flexDirection: 'column',
                gap: 3,
                cursor: 'pointer',
                border: `1px solid ${active ? C.primary : C.outlineVariant}`,
                textAlign: 'left',
                width: '100%',
              }}>
                <span style={{ fontSize: '0.52rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: active ? C.primary : C.outline, fontWeight: 700 }}>{label}</span>
                <span style={{ fontSize: 11, fontWeight: 800, color: active ? C.primary : C.tertiary }}>{value}</span>
              </button>
            );
          })}
        </div>

        {loading && <p style={{ textAlign: 'center', color: C.outline, fontSize: 13 }}>Loading programs...</p>}

        {featured && (
          <FeaturedCard template={featured} onInfo={() => setModalTemplate(featured)} onUse={() => selectTemplate(featured)} rationale={recommendationRationale} />
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
          {rest.map((t) => (
            <StandardCard
              key={t.id}
              template={t}
              expanded={expandedId === t.id}
              onToggle={() => setExpandedId(expandedId === t.id ? null : t.id)}
              onInfo={() => setModalTemplate(t)}
              onUse={() => selectTemplate(t)}
            />
          ))}
        </div>

        {filtered.length === 0 && !loading && (
          <p style={{ textAlign: 'center', padding: '60px 0', color: C.outline, fontSize: 13 }}>No programs match this filter.</p>
        )}
      </div>

      {modalTemplate && (
        <DetailModal
          template={modalTemplate}
          totalWeeks={modalTemplate.durationWeeks}
          detail={templateDetailsCache[modalTemplate.id] ?? null}
          detailLoading={detailLoadingId === modalTemplate.id}
          onClose={closeModal}
          onUse={() => { closeModal(); selectTemplate(modalTemplate); }}
        />
      )}
    </div>
  );
}

function FeaturedCard({ template, onInfo, onUse, rationale }: { template: Template; onInfo: () => void; onUse: () => void; rationale: string | null }) {
  const ac = ACCENT[template.accentKey];
  return (
    <div style={{ background: C.surfaceContainer, border: `1px solid ${C.outlineVariant}`, borderLeft: `3px solid ${ac}`, borderRadius: 16, overflow: 'hidden', boxShadow: `0 0 50px -14px rgba(${rgb(ac)},0.30)` }}>
      <div style={{ position: 'relative', height: 120, background: C.surfaceHighest }}>
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to bottom, rgba(17,19,24,0) 30%, ${C.surfaceContainer} 100%)`, zIndex: 2 }} />
        {template.badge && (
          <div style={{ position: 'absolute', top: 12, left: 14, zIndex: 3, background: ac, color: '#05080f', fontSize: '0.57rem', letterSpacing: '0.2em', fontWeight: 800, padding: '4px 11px', borderRadius: 100, textTransform: 'uppercase' }}>
            {template.badge}
          </div>
        )}
        <button onClick={onInfo} style={{ position: 'absolute', top: 10, right: 12, zIndex: 3, background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <InfoIcon color={C.onSurfaceVariant} />
        </button>
        <div style={{ position: 'absolute', bottom: 18, left: 18, zIndex: 2 }}>
          <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 900, fontSize: 'clamp(1.4rem,5vw,1.9rem)', letterSpacing: '-0.04em', color: C.onSurface, lineHeight: 1 }}>{template.name}</span>
        </div>
      </div>
      <div style={{ padding: '16px 18px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: '0.57rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: ac, fontWeight: 700 }}>{template.tag}</span>
          <span style={{ width: 3, height: 3, borderRadius: '50%', background: C.outlineVariant }} />
          <span style={{ fontSize: '0.57rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: C.outline, fontWeight: 600 }}>{template.experience}</span>
        </div>
        {rationale && (
          <p style={{ fontSize: 12, color: C.tertiary, fontWeight: 600, margin: '0 0 10px' }}>Recommended for you</p>
        )}
        <p style={{ color: C.onSurfaceVariant, fontSize: 13, lineHeight: 1.6, fontWeight: 500, margin: '0 0 14px' }}>{template.description}</p>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 14 }}>
          {template.days.map((d, i) => {
            const c = DAY_COLORS[i % DAY_COLORS.length]!;
            return <span key={i} style={{ fontSize: 10, fontWeight: 700, color: c, background: `rgba(${rgb(c)},0.1)`, borderRadius: 5, padding: '3px 9px' }}>{d}</span>;
          })}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onUse} style={{ flex: 1, padding: '13px 0', borderRadius: 12, border: 'none', background: `linear-gradient(135deg,${C.primary} 0%,#3a5cbf 100%)`, color: '#05080f', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 900, fontSize: 13, cursor: 'pointer' }}>
            Start This Program →
          </button>
          <button onClick={onInfo} style={{ flex: 1, padding: '13px 0', borderRadius: 12, border: `1px solid ${C.outlineVariant}`, background: 'transparent', color: C.onSurfaceVariant, fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            Preview
          </button>
        </div>
      </div>
    </div>
  );
}

function StandardCard({ template, expanded, onToggle, onInfo, onUse }: {
  template: Template; expanded: boolean;
  onToggle: () => void; onInfo: () => void; onUse: () => void;
}) {
  const ac = ACCENT[template.accentKey];
  return (
    <div style={{ background: C.surfaceContainer, border: `1px solid ${C.outlineVariant}`, borderLeft: `3px solid ${ac}`, borderRadius: 16, boxShadow: expanded ? `0 0 30px -10px rgba(${rgb(ac)},0.22)` : 'none' }}>
      <div style={{ padding: '16px 16px 14px', cursor: 'pointer' }} onClick={onToggle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5, flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.57rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: ac, fontWeight: 700 }}>{template.tag}</span>
              {template.badge && <span style={{ fontSize: '0.5rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: C.onSurface, background: C.surfaceHigh, padding: '2px 7px', borderRadius: 100, fontWeight: 700 }}>{template.badge}</span>}
            </div>
            <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, fontSize: 'clamp(1.1rem,4vw,1.3rem)', letterSpacing: '-0.035em', color: C.onSurface, margin: 0, lineHeight: 1.15 }}>{template.name}</h3>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 7, marginTop: 12, flexWrap: 'wrap' }}>
          {template.stats.map((s) => (
            <div key={s.label} style={{ background: C.surfaceHigh, borderRadius: 7, padding: '5px 9px' }}>
              <span style={{ display: 'block', fontSize: '0.5rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: C.outline, fontWeight: 700 }}>{s.label}</span>
              <span style={{ display: 'block', fontSize: 11, fontWeight: 800, color: C.onSurfaceVariant, marginTop: 2 }}>{s.value}</span>
            </div>
          ))}
        </div>
      </div>
      {expanded && (
        <div style={{ padding: '0 16px 16px', borderTop: `1px solid ${C.outlineVariant}`, paddingTop: 14 }}>
          <p style={{ color: C.onSurfaceVariant, fontSize: 13, lineHeight: 1.6, fontWeight: 500, margin: '0 0 12px' }}>{template.description}</p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={(e) => { e.stopPropagation(); onUse(); }} style={{ flex: 1, padding: '12px 0', borderRadius: 12, border: 'none', background: `linear-gradient(135deg,${C.primary} 0%,#3a5cbf 100%)`, color: '#05080f', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 900, fontSize: 13, cursor: 'pointer' }}>
              Start This Program →
            </button>
            <button onClick={(e) => { e.stopPropagation(); onInfo(); }} style={{ flex: 1, padding: '12px 0', borderRadius: 12, border: `1px solid ${C.outlineVariant}`, background: 'transparent', color: C.onSurfaceVariant, fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              Preview
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function DurationPicker({
  totalWeeks,
  durationMode,
  showCustomStepper,
  onSelectPreset,
  onOpenCustom,
  onStepCustom,
  onDismissCustom,
}: {
  totalWeeks: number;
  durationMode: 'preset' | 'custom';
  showCustomStepper: boolean;
  onSelectPreset: (w: number) => void;
  onOpenCustom: () => void;
  onStepCustom: (delta: number) => void;
  onDismissCustom: () => void;
}) {
  const pillBase: React.CSSProperties = {
    flex: 1,
    padding: '12px 0',
    borderRadius: 12,
    fontFamily: 'Manrope, sans-serif',
    fontWeight: 700,
    fontSize: 13,
    cursor: 'pointer',
  };

  const isCustomActive = durationMode === 'custom' && !DURATION_PRESETS.includes(totalWeeks as typeof DURATION_PRESETS[number]);

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
      {DURATION_PRESETS.map((w) => {
        const selected = durationMode === 'preset' && totalWeeks === w;
        return (
          <button
            key={w}
            type="button"
            onClick={() => onSelectPreset(w)}
            style={{
              ...pillBase,
              border: selected ? 'none' : `1px solid ${C.outlineVariant}`,
              background: selected ? C.primary : 'transparent',
              color: selected ? '#05080f' : C.onSurfaceVariant,
            }}
          >
            {w} weeks
          </button>
        );
      })}

      {showCustomStepper ? (
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 6,
          padding: '6px 8px',
          borderRadius: 12,
          border: `1px solid ${C.primary}`,
          background: `rgba(${rgb(C.primary)},0.08)`,
        }}>
          <button type="button" onClick={() => onStepCustom(-1)} disabled={totalWeeks <= MIN_CUSTOM_WEEKS} style={{ background: C.surfaceHigh, border: 'none', borderRadius: 8, width: 28, height: 28, color: C.onSurface, fontWeight: 800, cursor: totalWeeks <= MIN_CUSTOM_WEEKS ? 'not-allowed' : 'pointer', opacity: totalWeeks <= MIN_CUSTOM_WEEKS ? 0.4 : 1 }}>−</button>
          <span style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 13, color: C.primary, whiteSpace: 'nowrap' }}>{totalWeeks} wks</span>
          <button type="button" onClick={() => onStepCustom(1)} disabled={totalWeeks >= MAX_CUSTOM_WEEKS} style={{ background: C.surfaceHigh, border: 'none', borderRadius: 8, width: 28, height: 28, color: C.onSurface, fontWeight: 800, cursor: totalWeeks >= MAX_CUSTOM_WEEKS ? 'not-allowed' : 'pointer', opacity: totalWeeks >= MAX_CUSTOM_WEEKS ? 0.4 : 1 }}>+</button>
        </div>
      ) : isCustomActive ? (
        <button
          type="button"
          onClick={onDismissCustom}
          style={{
            ...pillBase,
            border: 'none',
            background: C.primary,
            color: '#05080f',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          {totalWeeks} weeks
          <span style={{ fontSize: 14, lineHeight: 1, opacity: 0.7 }}>×</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={onOpenCustom}
          style={{
            ...pillBase,
            flex: 0.7,
            border: `1px dashed ${C.outline}`,
            background: 'transparent',
            color: C.outline,
          }}
        >
          +
        </button>
      )}
    </div>
  );
}

function DetailModal({
  template,
  totalWeeks,
  detail,
  detailLoading,
  onClose,
  onUse,
}: {
  template: Template;
  totalWeeks: number;
  detail: TemplateDetail | null;
  detailLoading: boolean;
  onClose: () => void;
  onUse: () => void;
}) {
  const ac = ACCENT[template.accentKey];
  const sessions = sessionCount(template.frequencyPerWeek, totalWeeks);
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(8,10,16,0.85)', backdropFilter: 'blur(14px)' }} />
      <div onClick={(e) => e.stopPropagation()} style={{ position: 'relative', width: '100%', maxWidth: 600, background: C.surfaceContainer, borderRadius: '20px 20px 0 0', maxHeight: '88vh', overflowY: 'auto', border: `1px solid ${C.outlineVariant}`, borderBottom: 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0' }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: C.outlineVariant }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px 14px', background: C.surfaceLow, borderBottom: `1px solid ${C.outlineVariant}` }}>
          <div>
            <p style={{ margin: '0 0 2px', fontSize: '0.57rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: ac, fontWeight: 700 }}>{template.tag}</p>
            <h4 style={{ margin: 0, fontFamily: 'Space Grotesk, sans-serif', fontWeight: 900, fontSize: 20, letterSpacing: '-0.04em', color: C.onSurface }}>{template.name}</h4>
          </div>
          <button onClick={onClose} style={{ background: C.surfaceHigh, border: 'none', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <CloseIcon />
          </button>
        </div>
        <div style={{ padding: 20 }}>
          <p style={{ color: C.onSurfaceVariant, fontSize: 13, lineHeight: 1.6, fontWeight: 500, margin: '0 0 20px' }}>{template.description}</p>
          <SectionLabel text="Block Architecture" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 20 }}>
            {STATIC_MODAL_PHASES.map((ph, i) => (
              <div key={i} style={{ background: C.surfaceLow, borderRadius: 10, padding: '10px 12px', borderLeft: ph.accent ? `3px solid ${C.tertiary}` : `3px solid ${C.outlineVariant}` }}>
                <span style={{ display: 'block', fontSize: '0.5rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: ph.accent ? C.tertiary : C.outline, fontWeight: 700, marginBottom: 4 }}>{ph.label}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: C.onSurface }}>{ph.title}</span>
              </div>
            ))}
          </div>
          <SectionLabel text="What Gets Created" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
            <CreatesRow color={C.secondary} symbol="◈" label="1 Training block" sub={`${totalWeeks} weeks · ${template.frequencyPerWeek} sessions/week · MEV→MRV volume progression`} />
            <CreatesRow color={C.tertiary} symbol="⊞" label={`${sessions} Workout sessions`} sub="Engine delivers prescription per session — load, reps, RPE" />
            <CreatesRow color={C.primary} symbol="◉" label="Fatigue tracking" sub="SFL accumulates per-session · deload auto-fires at threshold" />
          </div>
          <SectionLabel text="Weekly Matrix" />
          {detailLoading && (
            <p style={{ margin: '0 0 12px', fontSize: 13, color: C.outline }}>Loading exercises...</p>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 24 }}>
            {(detail?.splitConfigs?.[0]?.days ?? template.days.map((label, idx) => ({
              dayNumber: idx + 1,
              label,
              exercises: [] as TemplateDetail['splitConfigs'][0]['days'][0]['exercises'],
            })))
              .filter((day) => !('dayType' in day) || (day as { dayType?: string }).dayType !== 'REST')
              .map((day, i) => {
              const c = DAY_COLORS[i % DAY_COLORS.length]!;
              const exercises = day.exercises?.filter((e) => e.exercise?.name) ?? [];
              return (
                <div key={day.dayNumber ?? i} style={{ background: C.surfaceLow, borderRadius: 10, borderLeft: `3px solid ${c}`, overflow: 'hidden' }}>
                  <div style={{ padding: '11px 14px' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.onSurface }}>Day {day.dayNumber ?? i + 1}: {day.label}</span>
                  </div>
                  {exercises.length > 0 && (
                    <div style={{ padding: '0 14px 10px 20px', display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {exercises.map((entry, j) => (
                        <div key={j} style={{ display: 'flex', alignItems: 'baseline', gap: 6, fontSize: 11, color: C.onSurfaceVariant, fontWeight: 500 }}>
                          <span style={{ color: c, fontWeight: 800, flexShrink: 0 }}>├</span>
                          <span>
                            {entry.exercise!.name} — {entry.setsTarget} sets — RPE {derivePreviewRpe(entry.repRangeMin, entry.repRangeMax)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <button onClick={onUse} style={{ width: '100%', padding: '15px 0', borderRadius: 14, border: 'none', background: `linear-gradient(135deg,${C.primary} 0%,#3a5cbf 100%)`, color: '#05080f', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 900, fontSize: 15, cursor: 'pointer' }}>
            Start This Program →
          </button>
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ text }: { text: string }) {
  return <p style={{ margin: '0 0 10px', fontSize: '0.57rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: C.outline, fontWeight: 700 }}>{text}</p>;
}

function CreatesRow({ color, symbol, label, sub }: { color: string; symbol: string; label: string; sub: string }) {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', background: C.surfaceLow, borderRadius: 10, padding: '10px 12px' }}>
      <span style={{ fontSize: 16, color, flexShrink: 0, marginTop: 1 }}>{symbol}</span>
      <div>
        <span style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.onSurface }}>{label}</span>
        <span style={{ display: 'block', fontSize: 11, fontWeight: 500, color: C.onSurfaceVariant, marginTop: 2, lineHeight: 1.45 }}>{sub}</span>
      </div>
    </div>
  );
}

function SearchIcon({ size = 20, color = C.outline }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <circle cx="9" cy="9" r="5.5" stroke={color} strokeWidth="1.6" />
      <path d="M13.5 13.5L17 17" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function InfoIcon({ color = C.outline }: { color?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6.5" stroke={color} strokeWidth="1.4" />
      <path d="M8 7v4" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="8" cy="5.5" r="0.75" fill={color} />
    </svg>
  );
}

function CloseIcon({ color = C.outline }: { color?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M2 2L12 12M12 2L2 12" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function NewMesocycleLoadingState() {
  return (
    <div style={{ minHeight: '100dvh', backgroundColor: C.surface, paddingBottom: 96 }}>
      <AppHeader title="Choose Program" showBack backHref="/mesocycles" />
      <div style={{ maxWidth: 600, margin: '0 auto', padding: 20 }}>
        <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: 13, color: C.outline }}>Loading...</p>
      </div>
    </div>
  );
}
