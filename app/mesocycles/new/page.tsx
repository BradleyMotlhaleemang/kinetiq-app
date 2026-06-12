'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Repeat } from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import { mesocyclesApi } from '@/lib/api/mesocycles';
import { templatesApi } from '@/lib/api/templates';
import { ApiError } from '@/lib/api/client';
import { mapApiTemplate, type BrowseTemplate } from '@/lib/programs/templateBrowse';
import ProgramSummaryCard from '@/components/ProgramSummaryCard';
import TrainingDayAccordion, { type TrainingDayItem } from '@/components/TrainingDayAccordion';
import { TYPE } from '@/lib/design/typography';

const C = {
  primary: '#b1c5ff',
  onPrimaryContainer: '#3d5183',
  tertiary: '#59d8de',
  surface: '#111318',
  surfaceLow: '#161820',
  surfaceContainer: '#1e2026',
  surfaceHigh: '#282a30',
  outline: '#8e909c',
  outlineVariant: '#3a3c44',
  onSurface: '#e2e2e8',
  onSurfaceVariant: '#c5c6d2',
  buttonText: '#05080f',
};

const DURATION_PRESETS = [4, 8] as const;
const MIN_CUSTOM_WEEKS = 2;
const MAX_CUSTOM_WEEKS = 16;

function rgb(hex: string) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r ? `${parseInt(r[1], 16)},${parseInt(r[2], 16)},${parseInt(r[3], 16)}` : '177,197,255';
}

function sessionCount(daysPerWeek: number, totalWeeks: number): number {
  return daysPerWeek * totalWeeks;
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

  const [selectedTemplate, setSelectedTemplate] = useState<BrowseTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [blockName, setBlockName] = useState('');
  const [totalWeeks, setTotalWeeks] = useState(8);
  const [durationMode, setDurationMode] = useState<'preset' | 'custom'>('preset');
  const [showCustomStepper, setShowCustomStepper] = useState(false);
  const [forking, setForking] = useState(false);
  const [isCustomFork, setIsCustomFork] = useState(false);
  const [templateDetail, setTemplateDetail] = useState<import('@/lib/api/templates').TemplateDetail | null>(null);

  useEffect(() => {
    if (!urlTemplateId) {
      router.replace('/mesocycles');
      return;
    }
    let cancelled = false;
    setLoading(true);
    templatesApi.findOne(urlTemplateId)
      .then((res) => {
        if (cancelled) return;
        const template = mapApiTemplate(res.data);
        setSelectedTemplate(template);
        setTemplateDetail(res.data as import('@/lib/api/templates').TemplateDetail);
        setBlockName(template.name);
        setTotalWeeks(template.durationWeeks);
        setDurationMode('preset');
        setShowCustomStepper(false);
      })
      .catch(() => {
        if (!cancelled) router.replace('/mesocycles');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [urlTemplateId, router]);

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

  async function handleCustomize() {
    if (!selectedTemplate || forking) return;
    setForking(true);
    try {
      const res = await templatesApi.fork(selectedTemplate.id);
      const forked = mapApiTemplate(res.data);
      setIsCustomFork(true);
      router.push(`/templates/${forked.id}/edit`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return;
      const message = err instanceof ApiError ? err.message : 'Failed to customize program';
      alert(message);
    } finally {
      setForking(false);
    }
  }

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
      alert('Failed to create block');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || !selectedTemplate) {
    return <NewMesocycleLoadingState />;
  }

  const sessions = sessionCount(selectedTemplate.frequencyPerWeek, totalWeeks);
  const previewDays: TrainingDayItem[] =
    templateDetail?.splitConfigs?.[0]?.days.map((day, index) => ({
      id: String(day.dayNumber),
      label: `Day ${day.dayNumber}: ${day.label}`,
      accentColor: [C.primary, '#d4bbff', C.tertiary, '#a2e7ff'][index % 4],
      exercises: (day.exercises ?? []).map((ex) => ({
        key: `${day.dayNumber}-${ex.orderIndex}`,
        name: ex.exercise?.name ?? 'Exercise',
        setsTarget: ex.setsTarget,
        repRangeMin: ex.repRangeMin,
        repRangeMax: ex.repRangeMax,
      })),
    })) ?? [];

  return (
    <div style={{ minHeight: '100dvh', backgroundColor: C.surface, paddingBottom: 128 }}>
      <AppHeader title="Configure Block" showBack backHref="/mesocycles" />
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 16px' }}>
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ ...TYPE.headlineSm, margin: '0 0 4px', color: C.onSurface }}>Configure Block</h2>
          <p style={{ ...TYPE.bodyMd, margin: 0, color: C.onSurfaceVariant }}>Define your next training phase.</p>
        </section>

        <div style={{ marginBottom: 24 }}>
          <ProgramSummaryCard
            variant="configure"
            name={selectedTemplate.name}
            experienceLevel={selectedTemplate.experience}
            onChangeProgram={() => router.push('/mesocycles')}
          />
        </div>

        {previewDays.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <TrainingDayAccordion
              days={previewDays}
              sectionLabel="Training Preview"
              compactHeader
              defaultExpandedId={previewDays[0]?.id ?? null}
            />
          </div>
        )}

        <section style={{ marginBottom: 24 }}>
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: 'block',
                ...TYPE.labelCaps,
                color: C.onSurfaceVariant,
                marginBottom: 8,
              }}
            >
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
                borderRadius: 8,
                padding: '12px 16px',
                color: C.onSurface,
                ...TYPE.bodyLg,
                outline: 'none',
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                ...TYPE.labelCaps,
                color: C.onSurfaceVariant,
                marginBottom: 8,
              }}
            >
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
        </section>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 16,
            marginBottom: 24,
            background: C.surfaceLow,
            border: `1px dashed ${C.outlineVariant}`,
            borderRadius: 8,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Repeat size={20} color={C.tertiary} strokeWidth={2} />
            <span style={{ ...TYPE.bodyMd, color: C.onSurfaceVariant }}>Total Sessions</span>
          </div>
          <span style={{ ...TYPE.headlineSm, color: C.tertiary }}>{sessions}</span>
        </div>

        <section style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 4 }}>
          {!isCustomFork && (
            <button
              type="button"
              onClick={handleCustomize}
              disabled={forking}
              style={{
                width: '100%',
                padding: '8px 0',
                background: 'none',
                border: 'none',
                cursor: forking ? 'wait' : 'pointer',
                ...TYPE.labelMeta,
                color: C.onSurfaceVariant,
                textDecoration: 'underline',
                textDecorationColor: C.outlineVariant,
                textUnderlineOffset: 4,
                opacity: forking ? 0.7 : 1,
              }}
            >
              {forking ? 'Preparing…' : 'Customize this program'}
            </button>
          )}

          <button
            type="button"
            onClick={handleCreate}
            disabled={submitting || !blockName.trim()}
            style={{
              width: '100%',
              padding: '16px 0',
              borderRadius: 8,
              border: 'none',
              background: submitting ? C.surfaceHigh : `linear-gradient(135deg, ${C.primary} 0%, #3a5cbf 100%)`,
              color: submitting ? C.outline : C.buttonText,
              ...TYPE.titleCta,
              textTransform: 'uppercase',
              cursor: submitting || !blockName.trim() ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.7 : 1,
              boxShadow: submitting ? 'none' : '0 4px 24px rgba(58,92,191,0.25)',
            }}
          >
            {submitting ? 'Creating...' : 'Create Block'}
          </button>
        </section>
      </div>
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
    padding: '12px 16px',
    borderRadius: 8,
    ...TYPE.titleCta,
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
              border: selected ? `1px solid ${C.primary}` : `1px solid ${C.outlineVariant}`,
              background: selected ? C.primary : 'transparent',
              color: selected ? C.onPrimaryContainer : C.onSurfaceVariant,
              boxShadow: selected ? '0 0 15px rgba(177,197,255,0.1)' : 'none',
            }}
          >
            {w} weeks
          </button>
        );
      })}

      {showCustomStepper ? (
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 6,
            padding: '6px 8px',
            borderRadius: 8,
            border: `1px solid ${C.primary}`,
            background: `rgba(${rgb(C.primary)},0.08)`,
          }}
        >
          <button
            type="button"
            onClick={() => onStepCustom(-1)}
            disabled={totalWeeks <= MIN_CUSTOM_WEEKS}
            style={{
              background: C.surfaceHigh,
              border: 'none',
              borderRadius: 8,
              width: 28,
              height: 28,
              color: C.onSurface,
              fontWeight: 800,
              cursor: totalWeeks <= MIN_CUSTOM_WEEKS ? 'not-allowed' : 'pointer',
              opacity: totalWeeks <= MIN_CUSTOM_WEEKS ? 0.4 : 1,
            }}
          >
            −
          </button>
          <span style={{ ...TYPE.titleCta, color: C.primary, whiteSpace: 'nowrap' }}>{totalWeeks} wks</span>
          <button
            type="button"
            onClick={() => onStepCustom(1)}
            disabled={totalWeeks >= MAX_CUSTOM_WEEKS}
            style={{
              background: C.surfaceHigh,
              border: 'none',
              borderRadius: 8,
              width: 28,
              height: 28,
              color: C.onSurface,
              fontWeight: 800,
              cursor: totalWeeks >= MAX_CUSTOM_WEEKS ? 'not-allowed' : 'pointer',
              opacity: totalWeeks >= MAX_CUSTOM_WEEKS ? 0.4 : 1,
            }}
          >
            +
          </button>
        </div>
      ) : isCustomActive ? (
        <button
          type="button"
          onClick={onDismissCustom}
          style={{
            ...pillBase,
            border: `1px solid ${C.primary}`,
            background: C.primary,
            color: C.onPrimaryContainer,
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
            flex: 1,
            border: `1px solid ${C.outlineVariant}`,
            background: 'transparent',
            color: C.onSurfaceVariant,
          }}
        >
          Custom
        </button>
      )}
    </div>
  );
}

function NewMesocycleLoadingState() {
  return (
    <div style={{ minHeight: '100dvh', backgroundColor: C.surface, paddingBottom: 128 }}>
      <AppHeader title="Configure Block" showBack backHref="/mesocycles" />
      <div style={{ maxWidth: 600, margin: '0 auto', padding: 16 }}>
        <p style={{ ...TYPE.bodyMd, color: C.outline }}>Loading...</p>
      </div>
    </div>
  );
}
