'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import { MesocycleExplainerSheet } from '@/components/MesocycleExplainer';
import { mesocyclesApi } from '@/lib/api/mesocycles';
import { templatesApi, type TemplateListItem } from '@/lib/api/templates';
import api, { ApiError } from '@/lib/api/client';

const C = {
  surface: '#111318',
  surfaceLow: '#161820',
  surfaceContainer: '#1e2026',
  surfaceHigh: '#282a30',
  outline: '#8e909c',
  outlineVariant: '#3a3c44',
  onSurface: '#e2e2e8',
  onSurfaceVariant: '#c5c6d2',
  primary: '#b1c5ff',
  secondary: '#d4bbff',
  tertiary: '#59d8de',
};

const ACCENT: Record<'primary' | 'secondary' | 'tertiary', string> = {
  primary: C.primary,
  secondary: C.secondary,
  tertiary: C.tertiary,
};

const DAY_COLORS = [C.primary, C.tertiary, C.secondary, '#a2e7ff'];

type MesocycleWorkout = {
  weekNumber?: number;
  dayNumber?: number;
  splitDayLabel?: string;
};

type MesocycleSummary = {
  id: string;
  name?: string;
  status?: string;
  currentWeek?: number;
  totalWeeks?: number;
  startDate?: string;
  workouts?: MesocycleWorkout[];
};

async function loadRecommendedPrograms(): Promise<TemplateListItem[]> {
  const [recRes, userRes] = await Promise.all([
    templatesApi.recommended(),
    api.get('/api/v1/users/me'),
  ]);

  const rec = recRes.data as {
    recommended?: TemplateListItem;
    alternatives?: TemplateListItem[];
  };
  const user = userRes.data as { goalMode?: string; experienceLevel?: string };

  const collected: TemplateListItem[] = [];
  const seen = new Set<string>();

  function add(t: TemplateListItem | undefined | null) {
    if (!t || seen.has(t.id) || collected.length >= 3) return;
    seen.add(t.id);
    collected.push(t);
  }

  add(rec.recommended ?? null);
  for (const alt of rec.alternatives ?? []) add(alt);

  if (collected.length < 3) {
    const goal = user.goalMode?.replace('_', ' ') ?? undefined;
    const level = user.experienceLevel ?? undefined;
    const filteredRes = await templatesApi.all({
      ...(goal ? { goal } : {}),
      ...(level ? { level } : {}),
    });
    const filtered = Array.isArray(filteredRes.data) ? (filteredRes.data as TemplateListItem[]) : [];
    for (const t of filtered) {
      add(t);
      if (collected.length >= 3) break;
    }
  }

  return collected;
}

function ProgramCard({ template, onClick }: { template: TemplateListItem; onClick: () => void }) {
  const accent = C.tertiary;
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: '100%',
        textAlign: 'left',
        cursor: 'pointer',
        background: C.surfaceContainer,
        border: `1px solid ${C.outlineVariant}`,
        borderLeft: `3px solid ${accent}`,
        borderRadius: 16,
        padding: '16px',
      }}
    >
      <p style={{ margin: '0 0 4px', fontSize: '0.57rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: accent, fontWeight: 700 }}>
        {template.primaryFocus}
      </p>
      <h3 style={{ margin: '0 0 8px', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, fontSize: 'clamp(1.1rem,4vw,1.3rem)', letterSpacing: '-0.035em', color: C.onSurface }}>
        {template.name}
      </h3>
      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
        {template.stats.slice(0, 3).map((s) => (
          <div key={s.label} style={{ background: C.surfaceHigh, borderRadius: 7, padding: '5px 9px' }}>
            <span style={{ display: 'block', fontSize: '0.5rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: C.outline, fontWeight: 700 }}>{s.label}</span>
            <span style={{ display: 'block', fontSize: 11, fontWeight: 800, color: C.onSurfaceVariant, marginTop: 2 }}>{s.value}</span>
          </div>
        ))}
      </div>
    </button>
  );
}

export default function MesocyclesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [mesocycles, setMesocycles] = useState<MesocycleSummary[]>([]);
  const [recommended, setRecommended] = useState<TemplateListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllPast, setShowAllPast] = useState(false);
  const [showExplainerSheet, setShowExplainerSheet] = useState(false);

  useEffect(() => {
    loadMesocycles();
  }, [pathname]);

  async function loadMesocycles() {
    try {
      const res = await mesocyclesApi.all();
      const data = Array.isArray(res.data) ? (res.data as MesocycleSummary[]) : [];
      setMesocycles(data);
      if (data.length === 0) {
        const programs = await loadRecommendedPrograms();
        setRecommended(programs);
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setMesocycles([]);
        return;
      }
      console.error('Failed to load mesocycles:', err);
      setMesocycles([]);
    } finally {
      setLoading(false);
    }
  }

  const mesocyclesArray = Array.isArray(mesocycles) ? mesocycles : [];
  const active = mesocyclesArray.filter((m) => m.status === 'ACTIVE' || m.status === 'DELOAD_TRIGGERED' || m.status === 'DELOAD_ACTIVE');
  const past = mesocyclesArray.filter((m) => m.status === 'COMPLETED');
  const activeBlock = active[0];
  const visiblePast = showAllPast ? past : past.slice(0, 3);

  return (
    <div style={{ minHeight: '100dvh', backgroundColor: C.surface, paddingBottom: 96 }}>
      <AppHeader title="Program" />

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 20px' }}>
        <button
          type="button"
          onClick={() => setShowExplainerSheet(true)}
          style={{
            marginBottom: 16,
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            fontFamily: 'Manrope, sans-serif',
            fontSize: 12,
            fontWeight: 700,
            color: C.primary,
          }}
        >
          What is a mesocycle?
        </button>
        {loading ? (
          <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: 13, color: C.outline }}>Loading...</p>
        ) : mesocyclesArray.length === 0 ? (
          <>
            <p style={{ margin: '0 0 6px', color: C.outline, fontSize: '0.57rem', letterSpacing: '0.24em', textTransform: 'uppercase', fontWeight: 700 }}>
              Programs
            </p>
            <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 900, fontSize: 'clamp(1.85rem,6vw,2.4rem)', letterSpacing: '-0.045em', color: C.onSurface, margin: '0 0 10px' }}>
              Choose your training program
            </h1>
            <p style={{ color: C.onSurfaceVariant, fontSize: 13, lineHeight: 1.6, margin: '0 0 24px' }}>
              Pick a proven split to generate your first training block in under two minutes.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
              {recommended.map((t) => (
                <ProgramCard key={t.id} template={t} onClick={() => router.push(`/mesocycles/new?templateId=${t.id}`)} />
              ))}
            </div>
            <button
              type="button"
              onClick={() => router.push('/mesocycles/new')}
              style={{
                width: '100%',
                padding: '14px 0',
                borderRadius: 12,
                border: 'none',
                background: 'linear-gradient(135deg, #b1c5ff 0%, #3a5cbf 100%)',
                color: '#05080f',
                fontFamily: 'Space Grotesk, sans-serif',
                fontWeight: 900,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              Create My First Block →
            </button>
          </>
        ) : (
          <>
            {activeBlock && (
              <div style={{
                background: C.surfaceContainer,
                border: `1px solid ${C.outlineVariant}`,
                borderLeft: `3px solid ${C.primary}`,
                borderRadius: 16,
                padding: '18px 20px',
                marginBottom: 24,
              }}>
                <p style={{ margin: '0 0 4px', fontSize: '0.57rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: C.primary, fontWeight: 700 }}>Active Block</p>
                <h2 style={{ margin: '0 0 12px', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 900, fontSize: 20, letterSpacing: '-0.04em', color: C.onSurface }}>
                  {activeBlock.name ?? 'Untitled Block'}
                </h2>
                <p style={{ margin: '0 0 12px', fontSize: 13, color: C.outline }}>
                  Week {activeBlock.currentWeek ?? 0} of {activeBlock.totalWeeks ?? 0}
                </p>
                <div style={{ height: 4, backgroundColor: C.surfaceHigh, borderRadius: 9999, overflow: 'hidden', marginBottom: 12 }}>
                  <div style={{
                    height: '100%',
                    width: `${activeBlock.totalWeeks ? Math.round(((activeBlock.currentWeek ?? 0) / activeBlock.totalWeeks) * 100) : 0}%`,
                    background: `linear-gradient(90deg, ${C.primary}, ${C.tertiary})`,
                    borderRadius: 9999,
                  }} />
                </div>
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 16 }}>
                  {deriveWeekOneDays(activeBlock).map((day, index) => {
                    const color = DAY_COLORS[index % DAY_COLORS.length]!;
                    return (
                      <span key={`${day}-${index}`} style={{ fontSize: 10, fontWeight: 700, color, background: `rgba(${rgb(color)},0.1)`, borderRadius: 5, padding: '3px 8px' }}>
                        {day}
                      </span>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={() => router.push(`/mesocycles/${activeBlock.id}`)}
                  style={{
                    width: '100%',
                    padding: '13px 0',
                    borderRadius: 12,
                    border: 'none',
                    background: 'linear-gradient(135deg, #b1c5ff 0%, #3a5cbf 100%)',
                    color: '#05080f',
                    fontFamily: 'Space Grotesk, sans-serif',
                    fontWeight: 900,
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  View Program →
                </button>
              </div>
            )}

            {past.length > 0 && (
              <section style={{ marginBottom: 24 }}>
                <p style={{ margin: '0 0 12px', fontSize: '0.57rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: C.outline, fontWeight: 700 }}>
                  Past Programs
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {visiblePast.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => router.push(`/mesocycles/${m.id}`)}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        cursor: 'pointer',
                        background: C.surfaceContainer,
                        border: `1px solid ${C.outlineVariant}`,
                        borderLeft: `3px solid ${ACCENT[accentKeyFromStatus(m.status)]}`,
                        borderRadius: 16,
                        padding: '14px 16px',
                      }}
                    >
                      <p style={{ margin: '0 0 4px', fontSize: '0.57rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: C.outline, fontWeight: 700 }}>Completed</p>
                      <p style={{ margin: 0, fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, fontSize: 16, color: C.onSurface }}>{m.name ?? 'Untitled Block'}</p>
                      <p style={{ margin: '4px 0 0', fontSize: 12, color: C.outline }}>{m.totalWeeks ?? 0} weeks · {formatReadableDate(m.startDate)}</p>
                    </button>
                  ))}
                </div>
                {past.length > 3 && !showAllPast && (
                  <button
                    type="button"
                    onClick={() => setShowAllPast(true)}
                    style={{ marginTop: 12, background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'Manrope, sans-serif', fontSize: 12, fontWeight: 700, color: C.primary }}
                  >
                    Show more
                  </button>
                )}
              </section>
            )}

            <button
              type="button"
              onClick={() => router.push('/mesocycles/new')}
              style={{
                width: '100%',
                padding: '14px 0',
                borderRadius: 12,
                border: `1px solid ${C.outlineVariant}`,
                background: 'transparent',
                color: C.onSurfaceVariant,
                fontFamily: 'Manrope, sans-serif',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Start a new block →
            </button>
          </>
        )}
      </div>

      {showExplainerSheet && (
        <MesocycleExplainerSheet onDismiss={() => setShowExplainerSheet(false)} />
      )}
    </div>
  );
}

function accentKeyFromStatus(status: string | undefined): 'primary' | 'secondary' | 'tertiary' {
  if (status === 'ACTIVE') return 'primary';
  if (status === 'COMPLETED') return 'secondary';
  return 'tertiary';
}

function deriveWeekOneDays(mesocycle: MesocycleSummary): string[] {
  const workouts = Array.isArray(mesocycle.workouts) ? mesocycle.workouts : [];
  if (workouts.length === 0) return [];
  return [...workouts]
    .filter((workout) => (workout.weekNumber ?? 1) === 1)
    .sort((a, b) => (a.dayNumber ?? 0) - (b.dayNumber ?? 0))
    .map((workout) => workout.splitDayLabel)
    .filter((label): label is string => typeof label === 'string' && label.length > 0)
    .filter((label, index, list) => list.indexOf(label) === index);
}

function formatReadableDate(value: string | undefined): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function rgb(hex: string): string {
  const parsed = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return parsed ? `${parseInt(parsed[1], 16)},${parseInt(parsed[2], 16)},${parseInt(parsed[3], 16)}` : '177,197,255';
}
