'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import { mesocyclesApi } from '@/lib/api/mesocycles';
import { ApiError } from '@/lib/api/client';
import { templatesApi, type TemplateListItem } from '@/lib/api/templates';
import { Plus, Zap } from 'lucide-react';

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

const TEMPLATE_ACCENT_COLORS = ['#59d8de', '#b1c5ff', '#d4bbff', '#a2e7ff'];

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

export default function MesocyclesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [mesocycles, setMesocycles] = useState<MesocycleSummary[]>([]);
  const [templates, setTemplates] = useState<TemplateListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMesocycles();
  }, [pathname]);

  async function loadMesocycles() {
    try {
      console.log('Loading mesocycles...');
      const res = await mesocyclesApi.all();
      // Ensure we always set an array
      const data = Array.isArray(res.data) ? (res.data as MesocycleSummary[]) : [];
      console.log('Loaded mesocycles:', data);
      setMesocycles(data);
      const templateRes = await templatesApi.all();
      setTemplates(Array.isArray(templateRes.data) ? templateRes.data : []);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        // Auth client already clears tokens and redirects on 401.
        setMesocycles([]);
        setTemplates([]);
        return;
      }
      console.error('Failed to load mesocycles:', err);
      // Set empty array to prevent crashes - this will show the empty state
      setMesocycles([]);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }

  // Ensure mesocycles is always an array for filtering
  const mesocyclesArray = Array.isArray(mesocycles) ? mesocycles : [];
  const active = mesocyclesArray.filter((m) => m.status === 'ACTIVE' || m.status === 'DELOAD_TRIGGERED' || m.status === 'DELOAD_ACTIVE');
  const past = mesocyclesArray.filter((m) => m.status === 'COMPLETED');

  return (
    <div style={{ minHeight: '100dvh', backgroundColor: C.surface, paddingBottom: '96px' }}>
      <AppHeader title="Mesocycles" />

      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '0 20px' }}>

        {/* Create CTA */}
        <button
          onClick={() => router.push('/mesocycles/new')}
          className="btn-primary"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            width: '100%',
            padding: '16px',
            borderRadius: '12px',
            marginBottom: '32px',
          }}
        >
          <Plus size={16} color="#05080f" />
          <span style={{
            fontFamily: 'Manrope, sans-serif',
            fontSize: '0.75rem',
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#05080f',
          }}>
            Create new block
          </span>
        </button>

        {loading ? (
          <p style={{ fontFamily: 'Manrope', fontSize: '0.875rem', color: C.outline }}>
            Loading...
          </p>
        ) : mesocycles.length === 0 ? (
          <EmptyState onCreate={() => router.push('/mesocycles/new')} />
        ) : (
          <>
            {active.length > 0 && (
              <section style={{ marginBottom: '32px' }}>
                <p className="label-sm" style={{ color: C.outline, marginBottom: '12px' }}>
                  Current
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {active.map((m) => (
                    <div
                      key={m.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => router.push(`/mesocycles/${m.id}`)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          router.push(`/mesocycles/${m.id}`);
                        }
                      }}
                      style={{
                        cursor: 'pointer',
                        background: C.surfaceContainer,
                        border: `1px solid ${C.outlineVariant}`,
                        borderLeft: `3px solid ${ACCENT[accentKeyFromStatus(m.status)]}`,
                        borderRadius: 16,
                        transition: 'box-shadow 0.3s ease',
                      }}
                    >
                      <div style={{ padding: '16px 16px 14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5, flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '0.57rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: ACCENT[accentKeyFromStatus(m.status)], fontWeight: 700 }}>
                                {m.status ?? 'UNKNOWN'}
                              </span>
                              {(m.status ?? '') === 'ACTIVE' && (
                                <span style={{ fontSize: '0.5rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: C.onSurface, background: C.surfaceHigh, padding: '2px 7px', borderRadius: 100, fontWeight: 700 }}>
                                  Active
                                </span>
                              )}
                            </div>
                            <h3 style={{ fontFamily: 'Space Grotesk,sans-serif', fontWeight: 800, fontSize: 'clamp(1.1rem,4vw,1.3rem)', letterSpacing: '-0.035em', color: C.onSurface, margin: 0, lineHeight: 1.15 }}>
                              {m.name ?? 'Untitled Mesocycle'}
                            </h3>
                          </div>
                          <div style={{ width: 30, height: 30, borderRadius: 8, background: C.surfaceHigh, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginLeft: 10, transition: 'background 0.2s', pointerEvents: 'none' }}>
                            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ transform: 'rotate(-90deg)' }}>
                              <path d="M2 4.5L6.5 9L11 4.5" stroke={C.outline} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: 7, marginTop: 12, flexWrap: 'wrap' }}>
                          <div style={{ background: C.surfaceHigh, borderRadius: 7, padding: '5px 9px' }}>
                            <span style={{ display: 'block', fontSize: '0.5rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: C.outline, fontWeight: 700 }}>Duration</span>
                            <span style={{ display: 'block', fontSize: 11, fontWeight: 800, color: C.onSurfaceVariant, marginTop: 2 }}>{`${m.totalWeeks ?? 0} weeks`}</span>
                          </div>
                          <div style={{ background: C.surfaceHigh, borderRadius: 7, padding: '5px 9px' }}>
                            <span style={{ display: 'block', fontSize: '0.5rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: C.outline, fontWeight: 700 }}>Progress</span>
                            <span style={{ display: 'block', fontSize: 11, fontWeight: 800, color: C.onSurfaceVariant, marginTop: 2 }}>{`Week ${m.currentWeek ?? 0} of ${m.totalWeeks ?? 0}`}</span>
                          </div>
                          <div style={{ background: C.surfaceHigh, borderRadius: 7, padding: '5px 9px' }}>
                            <span style={{ display: 'block', fontSize: '0.5rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: C.outline, fontWeight: 700 }}>Started</span>
                            <span style={{ display: 'block', fontSize: 11, fontWeight: 800, color: C.onSurfaceVariant, marginTop: 2 }}>{formatReadableDate(m.startDate)}</span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: 5, marginTop: 10, flexWrap: 'wrap' }}>
                          {deriveWeekOneDays(m).map((day, index) => {
                            const color = DAY_COLORS[index % DAY_COLORS.length]!;
                            return (
                              <span key={`${m.id}-${day}-${index}`} style={{ fontSize: 10, fontWeight: 700, color, background: `rgba(${rgb(color)},0.1)`, borderRadius: 5, padding: '3px 8px' }}>
                                {day}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {past.length > 0 && (
              <section>
                <p className="label-sm" style={{ color: C.outline, marginBottom: '12px' }}>
                  Past blocks
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {past.map((m) => (
                    <div
                      key={m.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => router.push(`/mesocycles/${m.id}`)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          router.push(`/mesocycles/${m.id}`);
                        }
                      }}
                      style={{
                        cursor: 'pointer',
                        background: C.surfaceContainer,
                        border: `1px solid ${C.outlineVariant}`,
                        borderLeft: `3px solid ${ACCENT[accentKeyFromStatus(m.status)]}`,
                        borderRadius: 16,
                        transition: 'box-shadow 0.3s ease',
                      }}
                    >
                      <div style={{ padding: '16px 16px 14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5, flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '0.57rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: ACCENT[accentKeyFromStatus(m.status)], fontWeight: 700 }}>
                                {m.status ?? 'UNKNOWN'}
                              </span>
                              {(m.status ?? '') === 'ACTIVE' && (
                                <span style={{ fontSize: '0.5rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: C.onSurface, background: C.surfaceHigh, padding: '2px 7px', borderRadius: 100, fontWeight: 700 }}>
                                  Active
                                </span>
                              )}
                            </div>
                            <h3 style={{ fontFamily: 'Space Grotesk,sans-serif', fontWeight: 800, fontSize: 'clamp(1.1rem,4vw,1.3rem)', letterSpacing: '-0.035em', color: C.onSurface, margin: 0, lineHeight: 1.15 }}>
                              {m.name ?? 'Untitled Mesocycle'}
                            </h3>
                          </div>
                          <div style={{ width: 30, height: 30, borderRadius: 8, background: C.surfaceHigh, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginLeft: 10, transition: 'background 0.2s', pointerEvents: 'none' }}>
                            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ transform: 'rotate(-90deg)' }}>
                              <path d="M2 4.5L6.5 9L11 4.5" stroke={C.outline} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: 7, marginTop: 12, flexWrap: 'wrap' }}>
                          <div style={{ background: C.surfaceHigh, borderRadius: 7, padding: '5px 9px' }}>
                            <span style={{ display: 'block', fontSize: '0.5rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: C.outline, fontWeight: 700 }}>Duration</span>
                            <span style={{ display: 'block', fontSize: 11, fontWeight: 800, color: C.onSurfaceVariant, marginTop: 2 }}>{`${m.totalWeeks ?? 0} weeks`}</span>
                          </div>
                          <div style={{ background: C.surfaceHigh, borderRadius: 7, padding: '5px 9px' }}>
                            <span style={{ display: 'block', fontSize: '0.5rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: C.outline, fontWeight: 700 }}>Progress</span>
                            <span style={{ display: 'block', fontSize: 11, fontWeight: 800, color: C.onSurfaceVariant, marginTop: 2 }}>{`Week ${m.currentWeek ?? 0} of ${m.totalWeeks ?? 0}`}</span>
                          </div>
                          <div style={{ background: C.surfaceHigh, borderRadius: 7, padding: '5px 9px' }}>
                            <span style={{ display: 'block', fontSize: '0.5rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: C.outline, fontWeight: 700 }}>Started</span>
                            <span style={{ display: 'block', fontSize: 11, fontWeight: 800, color: C.onSurfaceVariant, marginTop: 2 }}>{formatReadableDate(m.startDate)}</span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: 5, marginTop: 10, flexWrap: 'wrap' }}>
                          {deriveWeekOneDays(m).map((day, index) => {
                            const color = DAY_COLORS[index % DAY_COLORS.length]!;
                            return (
                              <span key={`${m.id}-${day}-${index}`} style={{ fontSize: 10, fontWeight: 700, color, background: `rgba(${rgb(color)},0.1)`, borderRadius: 5, padding: '3px 8px' }}>
                                {day}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section style={{ marginTop: '32px' }}>
              <p className="label-sm" style={{ color: C.outline, marginBottom: '12px' }}>
                Templates
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {templates.map((template, index) => (
                  <div key={template.id} style={{ position: 'relative', backgroundColor: C.surfaceContainer, border: `1px solid ${C.outlineVariant}`, borderRadius: '12px', padding: '12px 12px 12px 16px' }}>
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '5px', borderRadius: '12px 0 0 12px', backgroundColor: TEMPLATE_ACCENT_COLORS[index % TEMPLATE_ACCENT_COLORS.length]!, boxShadow: `0 0 10px ${TEMPLATE_ACCENT_COLORS[index % TEMPLATE_ACCENT_COLORS.length]!}` }} />
                    <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.92rem', fontWeight: 600, color: C.onSurface }}>
                      {template.name}
                    </p>
                    <p style={{ fontFamily: 'Manrope', fontSize: '0.72rem', color: C.onSurfaceVariant, marginTop: '2px' }}>
                      {template.splitStyleLabel} • {template.daysPerWeek} days/week • {template.durationWeeks} weeks
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
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
  // TODO: `/api/v1/mesocycles/all` may omit nested `workouts`; use empty days when unavailable.
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

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '60px 20px', textAlign: 'center', gap: '16px',
    }}>
      <div style={{
        width: '56px', height: '56px',
        borderRadius: '14px',
        backgroundColor: 'rgba(177,197,255,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Zap size={24} color={C.outline} />
      </div>
      <div>
        <p style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: '1.1rem', fontWeight: 600,
          letterSpacing: '-0.02em', color: C.onSurface, marginBottom: '8px',
        }}>
          No training blocks yet
        </p>
        <p style={{
          fontFamily: 'Manrope', fontSize: '0.875rem',
          color: C.onSurfaceVariant, lineHeight: 1.7, maxWidth: '260px',
        }}>
          Create your first mesocycle to start structured, adaptive training.
        </p>
      </div>
      <button onClick={onCreate} className="btn-primary" style={{ width: '200px', marginTop: '8px' }}>
        Get started
      </button>
    </div>
  );
}