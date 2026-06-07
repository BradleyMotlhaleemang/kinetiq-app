'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { mesocyclesApi } from '@/lib/api/mesocycles';
import { workoutsApi } from '@/lib/api/workouts';
import { templatesApi, type TemplateListItem } from '@/lib/api/templates';
import api, { ApiError } from '@/lib/api/client';
import AppHeader from '@/components/AppHeader';

const C = {
  primary: '#b1c5ff',
  secondary: '#d4bbff',
  tertiary: '#59d8de',
  surface: '#111318',
  surfaceLow: '#161820',
  surfaceContainer: '#1e2026',
  surfaceHigh: '#282a30',
  outline: '#8e909c',
  outlineVariant: '#3a3c44',
  onSurface: '#e2e2e8',
  onSurfaceVariant: '#c5c6d2',
};

const DAY_COLORS = [C.primary, C.tertiary, C.secondary, '#a2e7ff'];

const MUSCLE_LABEL_MAP: [string, string][] = [
  ['push', 'Chest · Shoulders · Triceps'],
  ['pull', 'Back · Biceps · Rear Delts'],
  ['leg', 'Quads · Hamstrings · Glutes · Calves'],
  ['lower', 'Quads · Hamstrings · Glutes · Calves'],
  ['upper', 'Chest · Back · Shoulders · Arms'],
  ['full body', 'Full Body'],
  ['full', 'Full Body'],
];

type ExpandDay = {
  id: string;
  dayNumber: number | null;
  sessionType: string;
  date: string;
  completed: boolean;
  prescription: { exercises?: unknown[] } | null;
};

type ExpandWeek = {
  weekNumber: number;
  label: string;
  days: ExpandDay[];
};

type ExpandProgram = {
  id: string;
  name: string;
  currentWeek: number;
  totalWeeks?: number;
  weekCount: number;
  startDate: string;
  weeks: ExpandWeek[];
};

type MesocycleActive = {
  id: string;
  name: string;
  currentWeek: number;
  totalWeeks: number;
  startDate?: string;
};

type HistoryWorkout = {
  id: string;
  splitDayLabel?: string;
  completedAt?: string;
  durationMinutes?: number;
  sets?: Array<{ weight?: number; exerciseId?: string }>;
};

type RecentPR = {
  id: string;
  type: string;
  scope: string;
  value: number;
  achievedAt: string;
  exercise?: { name?: string };
};

type SessionState = 'rest' | 'start' | 'resume' | 'completed';

function musclesFromLabel(label: string): string | null {
  const lower = label.toLowerCase();
  for (const [key, value] of MUSCLE_LABEL_MAP) {
    if (lower.includes(key)) return value;
  }
  return null;
}

function exerciseCount(day: ExpandDay | null): number {
  if (!day?.prescription) return 0;
  const exercises = day.prescription.exercises;
  return Array.isArray(exercises) ? exercises.length : 0;
}

function computeTodayDayNumber(startDate: string, currentWeek: number): number {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekStart = new Date(start);
  weekStart.setDate(start.getDate() + (currentWeek - 1) * 7);
  const diffDays = Math.floor((today.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 1;
  return (diffDays % 7) + 1;
}

function deriveSessionState(program: ExpandProgram, activeWorkoutId: string | null): {
  state: SessionState;
  todayWorkout: ExpandDay | null;
  nextWorkout: ExpandDay | null;
  accent: string;
} {
  const currentWeek = program.weeks.find((w) => w.weekNumber === program.currentWeek);
  if (!currentWeek) {
    return { state: 'rest', todayWorkout: null, nextWorkout: null, accent: C.outline };
  }

  const todayDayNumber = computeTodayDayNumber(program.startDate, program.currentWeek);
  const todayWorkout = currentWeek.days.find((d) => d.dayNumber === todayDayNumber) ?? null;
  const nextWorkout = currentWeek.days.find((d) => !d.completed) ?? null;
  const allWeekComplete = currentWeek.days.length > 0 && currentWeek.days.every((d) => d.completed);

  if (!todayWorkout) {
    return { state: 'rest', todayWorkout: null, nextWorkout, accent: C.outline };
  }

  if (activeWorkoutId && todayWorkout.id === activeWorkoutId) {
    return { state: 'resume', todayWorkout, nextWorkout, accent: C.primary };
  }

  if (todayWorkout.completed || allWeekComplete) {
    return { state: 'completed', todayWorkout, nextWorkout, accent: C.tertiary };
  }

  return { state: 'start', todayWorkout, nextWorkout, accent: C.primary };
}

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
        borderLeft: `3px solid ${C.tertiary}`,
        borderRadius: 16,
        padding: '16px',
      }}
    >
      <p style={{ margin: '0 0 4px', fontSize: '0.57rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: C.tertiary, fontWeight: 700 }}>
        {template.primaryFocus}
      </p>
      <h3 style={{ margin: '0 0 8px', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, fontSize: 'clamp(1.1rem,4vw,1.3rem)', letterSpacing: '-0.035em', color: C.onSurface }}>
        {template.name}
      </h3>
      <p style={{ margin: 0, fontSize: 12, color: C.outline }}>
        {template.daysPerWeek} days/week · {template.durationWeeks} weeks · {template.level}
      </p>
    </button>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, hydrated } = useAuthStore();

  const [mesocycle, setMesocycle] = useState<MesocycleActive | null>(null);
  const [program, setProgram] = useState<ExpandProgram | null>(null);
  const [activeWorkoutId, setActiveWorkoutId] = useState<string | null>(null);
  const [lastSession, setLastSession] = useState<HistoryWorkout | null>(null);
  const [recentPr, setRecentPr] = useState<RecentPR | null>(null);
  const [recommended, setRecommended] = useState<TemplateListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    if (!isAuthenticated()) {
      router.push('/auth/login');
      return;
    }
    loadData();
  }, [hydrated]);

  async function loadData() {
    try {
      const mesoRes = await mesocyclesApi.active();
      const activeMeso = mesoRes.data as MesocycleActive | null;

      if (!activeMeso?.id) {
        const programs = await loadRecommendedPrograms();
        setRecommended(programs);
        setMesocycle(null);
        return;
      }

      setMesocycle(activeMeso);

      const [expandRes, histRes, prsRes, activeRes] = await Promise.allSettled([
        api.get(`/api/v1/mesocycles/${activeMeso.id}/expand`),
        workoutsApi.history(),
        api.get('/api/v1/prs/recent?limit=5'),
        api.get('/api/v1/workouts/active'),
      ]);

      if (expandRes.status === 'fulfilled') setProgram(expandRes.value.data as ExpandProgram);

      if (histRes.status === 'fulfilled') {
        const history = Array.isArray(histRes.value.data) ? histRes.value.data as HistoryWorkout[] : [];
        setLastSession(history[0] ?? null);
      }

      if (prsRes.status === 'fulfilled') {
        const prs = Array.isArray(prsRes.value.data) ? prsRes.value.data as RecentPR[] : [];
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const recent = prs.find((pr) => new Date(pr.achievedAt).getTime() >= sevenDaysAgo) ?? null;
        setRecentPr(recent);
      }

      if (activeRes.status === 'fulfilled') {
        const active = Array.isArray(activeRes.value.data) ? activeRes.value.data as Array<{ id: string }> : [];
        setActiveWorkoutId(active[0]?.id ?? null);
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return;
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleStartWorkout(targetDay: ExpandDay | null) {
    if (!mesocycle || starting) return;
    setStarting(true);
    try {
      if (targetDay?.id) {
        router.push(`/workout/${targetDay.id}`);
        return;
      }
      const res = await workoutsApi.create({ mesocycleId: mesocycle.id });
      router.push(`/workout/${res.data.id}`);
    } catch (err) {
      console.error('Failed to start workout', err);
    } finally {
      setStarting(false);
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100dvh', backgroundColor: C.surface, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: C.outline, fontFamily: 'Manrope, sans-serif', fontSize: 13 }}>Loading...</p>
      </div>
    );
  }

  if (!mesocycle) {
    return (
      <div style={{ minHeight: '100dvh', backgroundColor: C.surface, paddingBottom: 110 }}>
        <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 20px' }}>
          <AppHeader />
          <main style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{
              background: C.surfaceContainer,
              border: `1px solid ${C.outlineVariant}`,
              borderLeft: `3px solid ${C.primary}`,
              borderRadius: 16,
              padding: '24px 20px',
            }}>
              <p style={{ margin: '0 0 6px', color: C.outline, fontSize: '0.57rem', letterSpacing: '0.24em', textTransform: 'uppercase', fontWeight: 700 }}>
                Get Started
              </p>
              <h1 style={{ margin: '0 0 10px', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 900, fontSize: 'clamp(1.85rem,6vw,2.4rem)', letterSpacing: '-0.045em', color: C.onSurface }}>
                Set up your first training block
              </h1>
              <p style={{ margin: 0, fontSize: 13, color: C.onSurfaceVariant, lineHeight: 1.6 }}>
                Pick a program and we will generate every session automatically. Takes about two minutes.
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {recommended.map((t) => (
                <ProgramCard key={t.id} template={t} onClick={() => router.push(`/mesocycles/new?templateId=${t.id}`)} />
              ))}
            </div>
            <button
              type="button"
              onClick={() => router.push('/mesocycles/new')}
              style={{
                width: '100%',
                padding: '15px 0',
                borderRadius: 14,
                border: 'none',
                background: 'linear-gradient(135deg, #b1c5ff 0%, #3a5cbf 100%)',
                color: '#05080f',
                fontFamily: 'Space Grotesk, sans-serif',
                fontWeight: 900,
                fontSize: 15,
                cursor: 'pointer',
              }}
            >
              Get Started →
            </button>
          </main>
        </div>
      </div>
    );
  }

  const session = program
    ? deriveSessionState(program, activeWorkoutId)
    : { state: 'start' as SessionState, todayWorkout: null, nextWorkout: null, accent: C.primary };

  const displayDay = session.todayWorkout ?? session.nextWorkout;
  const dayLabel = displayDay?.sessionType ?? 'Training Session';
  const muscles = displayDay ? musclesFromLabel(displayDay.sessionType) : null;
  const count = exerciseCount(displayDay);
  const progressPct = mesocycle.totalWeeks > 0
    ? Math.round((mesocycle.currentWeek / mesocycle.totalWeeks) * 100)
    : 0;

  const topLift = lastSession?.sets?.reduce<{ weight: number; exerciseId?: string } | null>((best, set) => {
    const w = set.weight ?? 0;
    if (!best || w > best.weight) return { weight: w, exerciseId: set.exerciseId };
    return best;
  }, null);

  return (
    <div style={{ minHeight: '100dvh', backgroundColor: C.surface, paddingBottom: 110 }}>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 20px' }}>
        <AppHeader />
        <main style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Today's Session */}
          <div style={{
            background: C.surfaceContainer,
            border: `1px solid ${C.outlineVariant}`,
            borderLeft: `3px solid ${session.accent}`,
            borderRadius: 16,
            padding: '20px',
          }}>
            <p style={{ margin: '0 0 8px', fontSize: '0.57rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: session.accent, fontWeight: 700 }}>
              {session.state === 'rest' ? 'Rest Day' : "Today's Session"}
            </p>

            {session.state === 'rest' ? (
              <>
                <h2 style={{ margin: '0 0 8px', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 900, fontSize: 22, letterSpacing: '-0.04em', color: C.onSurface }}>
                  Rest Day
                </h2>
                <p style={{ margin: 0, fontSize: 13, color: C.onSurfaceVariant, lineHeight: 1.6 }}>
                  Next session: {session.nextWorkout?.sessionType ?? '—'}
                </p>
              </>
            ) : (
              <>
                <h2 style={{ margin: '0 0 8px', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 900, fontSize: 22, letterSpacing: '-0.04em', color: C.onSurface }}>
                  {dayLabel}
                </h2>
                <p style={{ margin: '0 0 4px', fontSize: 13, color: C.onSurfaceVariant }}>
                  Week {mesocycle.currentWeek} · Day {displayDay?.dayNumber ?? '—'}
                </p>
                {muscles && (
                  <p style={{ margin: '0 0 4px', fontSize: 12, color: C.outline }}>{muscles}</p>
                )}
                {count > 0 && (
                  <p style={{ margin: '0 0 16px', fontSize: 12, color: C.outline }}>{count} exercises</p>
                )}
                {session.state !== 'completed' && (
                  <button
                    type="button"
                    onClick={() => handleStartWorkout(session.todayWorkout ?? session.nextWorkout)}
                    disabled={starting}
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
                      cursor: starting ? 'not-allowed' : 'pointer',
                      opacity: starting ? 0.7 : 1,
                    }}
                  >
                    {starting ? 'Starting...' : session.state === 'resume' ? 'Resume Workout' : 'Start Workout'}
                  </button>
                )}
                {session.state === 'completed' && (
                  <button
                    type="button"
                    disabled
                    style={{
                      width: '100%',
                      padding: '14px 0',
                      borderRadius: 12,
                      border: `1px solid ${C.outlineVariant}`,
                      background: C.surfaceHigh,
                      color: C.outline,
                      fontFamily: 'Manrope, sans-serif',
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: 'not-allowed',
                    }}
                  >
                    Completed
                  </button>
                )}
              </>
            )}
          </div>

          {/* Program Progress */}
          <button
            type="button"
            onClick={() => router.push(`/mesocycles/${mesocycle.id}`)}
            style={{
              width: '100%',
              textAlign: 'left',
              cursor: 'pointer',
              background: C.surfaceContainer,
              border: `1px solid ${C.outlineVariant}`,
              borderLeft: `3px solid ${C.secondary}`,
              borderRadius: 16,
              padding: '16px 18px',
            }}
          >
            <p style={{ margin: '0 0 4px', fontSize: '0.57rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: C.outline, fontWeight: 700 }}>
              Program Progress
            </p>
            <p style={{ margin: '0 0 8px', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, fontSize: 16, color: C.onSurface }}>
              {mesocycle.name}
            </p>
            <p style={{ margin: '0 0 10px', fontSize: 12, color: C.outline }}>
              Week {mesocycle.currentWeek} of {mesocycle.totalWeeks}
            </p>
            <div style={{ height: 4, backgroundColor: C.surfaceHigh, borderRadius: 9999, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progressPct}%`, background: `linear-gradient(90deg, ${C.primary}, ${C.tertiary})`, borderRadius: 9999 }} />
            </div>
          </button>

          {/* Last Session */}
          {lastSession && (
            <button
              type="button"
              onClick={() => router.push('/history')}
              style={{
                width: '100%',
                textAlign: 'left',
                cursor: 'pointer',
                background: C.surfaceContainer,
                border: `1px solid ${C.outlineVariant}`,
                borderLeft: `3px solid ${C.tertiary}`,
                borderRadius: 16,
                padding: '16px 18px',
              }}
            >
              <p style={{ margin: '0 0 4px', fontSize: '0.57rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: C.outline, fontWeight: 700 }}>
                Last Session
              </p>
              <p style={{ margin: '0 0 4px', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, fontSize: 16, color: C.onSurface }}>
                {lastSession.splitDayLabel ?? 'Training Session'}
              </p>
              <p style={{ margin: 0, fontSize: 12, color: C.outline }}>
                {lastSession.completedAt
                  ? new Date(lastSession.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  : '—'}
                {lastSession.durationMinutes ? ` · ${lastSession.durationMinutes} mins` : ''}
                {topLift?.weight ? ` · Top lift ${topLift.weight} kg` : ''}
              </p>
            </button>
          )}

          {/* Recent PR */}
          {recentPr && (
            <div style={{
              background: C.surfaceContainer,
              border: `1px solid ${C.outlineVariant}`,
              borderLeft: `3px solid ${C.primary}`,
              borderRadius: 16,
              padding: '16px 18px',
            }}>
              <p style={{ margin: '0 0 4px', fontSize: '0.57rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: C.outline, fontWeight: 700 }}>
                Recent PR
              </p>
              <p style={{ margin: '0 0 4px', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, fontSize: 16, color: C.onSurface }}>
                {recentPr.exercise?.name ?? 'Personal Record'}
              </p>
              <p style={{ margin: 0, fontSize: 12, color: C.tertiary, fontWeight: 700 }}>
                {recentPr.value} kg · {new Date(recentPr.achievedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
