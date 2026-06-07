'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import { mesocyclesApi } from '@/lib/api/mesocycles';
import { workoutsApi } from '@/lib/api/workouts';
import api, { ApiError } from '@/lib/api/client';
import { BarChart2, CheckCircle } from 'lucide-react';

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

const sectionLabel: React.CSSProperties = {
  margin: 0,
  fontSize: '0.57rem',
  letterSpacing: '0.22em',
  textTransform: 'uppercase',
  color: C.outline,
  fontWeight: 700,
};

const primaryBtn: React.CSSProperties = {
  width: '100%',
  padding: '14px 0',
  borderRadius: 12,
  border: 'none',
  background: `linear-gradient(135deg, ${C.primary} 0%, #3a5cbf 100%)`,
  color: '#05080f',
  fontFamily: 'Space Grotesk, sans-serif',
  fontWeight: 900,
  fontSize: 14,
  cursor: 'pointer',
};

const ghostBtn: React.CSSProperties = {
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
};

type ExpandDay = {
  id: string;
  dayNumber: number | null;
  sessionType: string;
  date: string;
  completed: boolean;
  prescription: unknown;
};

type ExpandWeek = {
  weekNumber: number;
  isDeloadWeek: boolean;
  label: string;
  days: ExpandDay[];
};

type ExpandProgram = {
  id: string;
  name: string;
  status: string;
  weekCount: number;
  currentWeek: number;
  startDate: string;
  volumeTargets: Record<string, { mev: number; mrv: number; current: number }>;
  weeks: ExpandWeek[];
};

type MesocycleRecord = {
  id: string;
  name: string;
  status: string;
  currentWeek: number;
  totalWeeks: number;
};

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

function findTodayWorkout(program: ExpandProgram): ExpandDay | null {
  const currentWeek = program.weeks.find((w) => w.weekNumber === program.currentWeek);
  if (!currentWeek) return null;
  const todayDayNumber = computeTodayDayNumber(program.startDate, program.currentWeek);
  return currentWeek.days.find((d) => d.dayNumber === todayDayNumber) ?? null;
}

function findNextPlannedDay(program: ExpandProgram): ExpandDay | null {
  const currentWeek = program.weeks.find((w) => w.weekNumber === program.currentWeek);
  if (!currentWeek) return null;
  return currentWeek.days.find((d) => !d.completed) ?? null;
}

function computeSessionProgress(program: ExpandProgram | null): {
  completed: number;
  total: number;
  pct: number;
} {
  if (!program?.weeks?.length) return { completed: 0, total: 0, pct: 0 };
  const allDays = program.weeks.flatMap((w) => w.days);
  const completed = allDays.filter((d) => d.completed).length;
  const total = allDays.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  return { completed, total, pct };
}

function computeCalendarWeek(startDate: string, totalWeeks: number): number {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 1;
  const week = Math.floor(diffDays / 7) + 1;
  return Math.min(Math.max(week, 1), totalWeeks);
}

export default function MesocycleDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [mesocycle, setMesocycle] = useState<MesocycleRecord | null>(null);
  const [program, setProgram] = useState<ExpandProgram | null>(null);
  const [volumeTargets, setVolumeTargets] = useState<Record<string, { mev: number; mrv: number; current: number }>>({});
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    try {
      const [mRes, vRes, expandRes] = await Promise.allSettled([
        mesocyclesApi.findOne(id),
        mesocyclesApi.volumeStatus(id),
        api.get(`/api/v1/mesocycles/${id}/expand`),
      ]);
      if (mRes.status === 'fulfilled') setMesocycle(mRes.value.data as MesocycleRecord);
      if (vRes.status === 'fulfilled') {
        const data = vRes.value.data as { volumeTargets?: typeof volumeTargets };
        setVolumeTargets(data.volumeTargets ?? {});
      }
      if (expandRes.status === 'fulfilled') setProgram(expandRes.value.data as ExpandProgram);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return;
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleStartToday() {
    if (!mesocycle || !program || starting) return;
    setStarting(true);
    try {
      const todayWorkout = findTodayWorkout(program);
      const targetDay = todayWorkout && !todayWorkout.completed ? todayWorkout : findNextPlannedDay(program);

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

  async function handleClose() {
    if (!confirm('Mark this block as completed?')) return;
    try {
      await mesocyclesApi.close(id);
      router.push('/mesocycles');
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return;
      console.error('Failed to close mesocycle:', err);
      alert('Failed to close mesocycle');
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100dvh', backgroundColor: C.surface }}>
        <AppHeader showBack backHref="/mesocycles" />
        <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: 13, color: C.outline, padding: 20 }}>Loading...</p>
      </div>
    );
  }

  if (!mesocycle) {
    return (
      <div style={{ minHeight: '100dvh', backgroundColor: C.surface }}>
        <AppHeader showBack backHref="/mesocycles" />
        <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: 13, color: '#ff6b6b', padding: 20 }}>Block not found.</p>
      </div>
    );
  }

  const sessionProgress = computeSessionProgress(program);
  const progressPct = sessionProgress.pct;
  const displayWeek = program
    ? computeCalendarWeek(program.startDate, mesocycle.totalWeeks)
    : mesocycle.currentWeek;

  const muscles = Object.entries(volumeTargets) as [string, { mev: number; mrv: number; current: number }][];
  const currentWeekData = program?.weeks.find((w) => w.weekNumber === displayWeek);

  return (
    <div style={{ minHeight: '100dvh', backgroundColor: C.surface, paddingBottom: 96 }}>
      <AppHeader title={mesocycle.name} showBack backHref="/mesocycles" />

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 20px' }}>

        {/* Status + progress */}
        <div style={{
          background: C.surfaceContainer,
          border: `1px solid ${C.outlineVariant}`,
          borderLeft: `3px solid ${C.tertiary}`,
          borderRadius: 16,
          padding: '18px 20px',
          marginBottom: 12,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <p style={{ ...sectionLabel, color: C.tertiary, marginBottom: 4 }}>{mesocycle.status}</p>
              <p style={{ margin: 0, fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.04em', color: C.onSurface }}>
                Week {displayWeek}
                <span style={{ fontSize: '0.875rem', color: C.outline, fontWeight: 400 }}> · {sessionProgress.completed} of {sessionProgress.total || '—'} sessions</span>
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, fontFamily: 'Space Grotesk, sans-serif', fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.04em', color: C.primary }}>
                {progressPct}%
              </p>
              <p style={{ margin: 0, fontSize: '0.57rem', color: C.outline, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700 }}>Complete</p>
            </div>
          </div>
          <div style={{ height: 4, backgroundColor: C.surfaceHigh, borderRadius: 9999, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${progressPct}%`,
              background: `linear-gradient(90deg, ${C.primary}, ${C.tertiary})`,
              borderRadius: 9999,
              transition: 'width 0.6s ease',
            }} />
          </div>
        </div>

        {/* Week/day grid */}
        {currentWeekData && (
          <div style={{
            background: C.surfaceContainer,
            border: `1px solid ${C.outlineVariant}`,
            borderRadius: 16,
            padding: '18px 20px',
            marginBottom: 12,
          }}>
            <p style={{ ...sectionLabel, marginBottom: 12 }}>{currentWeekData.label}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {currentWeekData.days.map((day, i) => {
                const color = DAY_COLORS[i % DAY_COLORS.length]!;
                return (
                  <div key={day.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: C.surfaceLow,
                    borderRadius: 10,
                    padding: '11px 14px',
                    borderLeft: `3px solid ${day.completed ? C.outline : color}`,
                    opacity: day.completed ? 0.6 : 1,
                  }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.onSurface }}>
                      Day {day.dayNumber}: {day.sessionType}
                    </span>
                    <span style={{ fontSize: 11, color: day.completed ? C.outline : color, fontWeight: 800 }}>
                      {day.completed ? 'Done' : '→'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Volume targets */}
        {muscles.length > 0 && (
          <div style={{
            background: C.surfaceContainer,
            border: `1px solid ${C.outlineVariant}`,
            borderRadius: 16,
            padding: '18px 20px',
            marginBottom: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <BarChart2 size={14} color={C.primary} />
              <p style={{ ...sectionLabel, color: C.primary }}>Volume targets</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {muscles.map(([muscle, targets]) => {
                const currentPct = targets.mrv > targets.mev
                  ? Math.min(((targets.current - targets.mev) / (targets.mrv - targets.mev)) * 100, 100)
                  : 0;
                return (
                  <div key={muscle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <p style={{ margin: 0, fontFamily: 'Manrope, sans-serif', fontSize: 12, color: C.onSurfaceVariant, textTransform: 'capitalize' }}>
                        {muscle.replace('_', ' ').toLowerCase()}
                      </p>
                      <p style={{ margin: 0, fontFamily: 'Manrope, sans-serif', fontSize: 12, color: C.outline }}>
                        {targets.current} sets · MEV {targets.mev} / MRV {targets.mrv}
                      </p>
                    </div>
                    <div style={{ height: 2, backgroundColor: C.surfaceHigh, borderRadius: 9999 }}>
                      <div style={{
                        height: '100%',
                        width: `${currentPct}%`,
                        backgroundColor: currentPct >= 90 ? '#ff6b6b' : currentPct >= 60 ? '#a2e7ff' : C.primary,
                        borderRadius: 9999,
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        {mesocycle.status === 'ACTIVE' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
            <button
              type="button"
              onClick={handleStartToday}
              disabled={starting}
              style={{
                ...primaryBtn,
                opacity: starting ? 0.7 : 1,
                cursor: starting ? 'not-allowed' : 'pointer',
              }}
            >
              {starting ? 'Starting...' : "Start today's session"}
            </button>
            <button type="button" onClick={handleClose} style={ghostBtn}>
              Mark as completed
            </button>
          </div>
        )}

        {mesocycle.status === 'COMPLETED' && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '14px 16px',
            background: `rgba(89,216,222,0.07)`,
            border: `1px solid rgba(89,216,222,0.2)`,
            borderLeft: `3px solid ${C.tertiary}`,
            borderRadius: 12,
            marginTop: 8,
          }}>
            <CheckCircle size={14} color={C.tertiary} />
            <p style={{ margin: 0, fontFamily: 'Manrope, sans-serif', fontSize: 12, fontWeight: 700, color: C.tertiary }}>
              Block completed
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
