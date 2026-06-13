'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { mesocyclesApi } from '@/lib/api/mesocycles';
import { workoutsApi } from '@/lib/api/workouts';
import { type TemplateListItem } from '@/lib/api/templates';
import api, { ApiError } from '@/lib/api/client';
import { loadRecommendedPrograms } from '@/lib/programs/loadRecommendations';
import { ChevronRight, Play, Trophy } from 'lucide-react';
import AppHeader from '@/components/AppHeader';

const PRIMARY = '#b1c5ff';
const PRIMARY_GLOW = 'rgba(177,197,255,0.35)';
const SECONDARY = '#d4bbff';
const TERTIARY = '#59d8de';
const SURFACE = '#111318';
const SURFACE_CONTAINER = '#1a1c22';
const SURFACE_HIGH = '#282a30';
const OUTLINE = '#8e909c';
const OUTLINE_VARIANT = '#3a3c44';
const ON_SURFACE = '#e2e2e8';
const ON_SURFACE_VARIANT = '#c5c6d2';

const STATIC_TAGLINE = 'Performance Protocol Activated';
const STATIC_START_LABEL = 'Ready to Engage';
const STATIC_RESUME_LABEL = 'Pick up where you left off';
const STATIC_PHILOSOPHY_LABEL = 'Philosophy';
const STATIC_PHILOSOPHY_HEADLINE =
  'Information without movement is useless. Movement without information is wasted.';
const STATIC_MOTIVATION_IMAGE_URL =
  'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&q=80&auto=format&fit=crop';
const STATIC_MOTIVATION_IMAGE_ALT = 'Athletic gym atmosphere';

const ROW_ACCENTS = [PRIMARY, SECONDARY, TERTIARY];

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
  dayLabel?: string;
  muscleSummary?: string | null;
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
  sessionType?: string;
  completedAt?: string;
  durationMinutes?: number;
};

type ActiveWorkoutSummary = {
  id: string;
  sessionType?: string;
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
    return { state: 'rest', todayWorkout: null, nextWorkout: null, accent: OUTLINE };
  }

  const todayDayNumber = computeTodayDayNumber(program.startDate, program.currentWeek);
  const todayWorkout = currentWeek.days.find((d) => d.dayNumber === todayDayNumber) ?? null;
  const nextWorkout = currentWeek.days.find((d) => !d.completed) ?? null;
  const allWeekComplete = currentWeek.days.length > 0 && currentWeek.days.every((d) => d.completed);

  if (!todayWorkout) {
    return { state: 'rest', todayWorkout: null, nextWorkout, accent: OUTLINE };
  }

  if (activeWorkoutId && todayWorkout.id === activeWorkoutId) {
    return { state: 'resume', todayWorkout, nextWorkout, accent: PRIMARY };
  }

  if (todayWorkout.completed || allWeekComplete) {
    return { state: 'completed', todayWorkout, nextWorkout, accent: TERTIARY };
  }

  return { state: 'start', todayWorkout, nextWorkout, accent: PRIMARY };
}

function formatRelativeDate(value: string): string {
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return 'Today';
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;
  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks === 1) return '1 week ago';
  if (diffWeeks < 5) return `${diffWeeks} weeks ago`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths === 1) return '1 month ago';
  return `${diffMonths} months ago`;
}

function scopeLabel(scope: string): string {
  if (scope === 'ALL_TIME') return 'ALL TIME';
  if (scope === 'MESOCYCLE') return 'THIS BLOCK';
  if (scope === 'MONTHLY') return 'THIS MONTH';
  return scope;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ margin: 0, fontFamily: 'Manrope, sans-serif', fontSize: '0.58rem', fontWeight: 700, color: OUTLINE, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
      {children}
    </p>
  );
}

function Card({ children, style, accentLeft }: { children: React.ReactNode; style?: React.CSSProperties; accentLeft?: string }) {
  return (
    <div style={{ backgroundColor: SURFACE_CONTAINER, border: `1px solid ${SURFACE_HIGH}`, borderLeft: accentLeft ? `4px solid ${accentLeft}` : undefined, borderRadius: '20px', padding: '20px', ...style }}>
      {children}
    </div>
  );
}

function WorkoutRow({ label, date, duration, accent, onClick }: { label: string; date: string; duration: string; accent: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px',
        backgroundColor: SURFACE_HIGH,
        borderRadius: '14px',
        cursor: 'pointer',
        border: '1px solid transparent',
        textAlign: 'left',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{ width: '5px', height: '40px', borderRadius: '9999px', backgroundColor: accent, flexShrink: 0 }} />
        <div>
          <p style={{ margin: 0, fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '0.88rem', color: ON_SURFACE }}>
            {label}
          </p>
          <p style={{ margin: '2px 0 0', fontFamily: 'Manrope, sans-serif', fontSize: '0.68rem', color: OUTLINE }}>
            {date} · {duration}
          </p>
        </div>
      </div>
      <ChevronRight size={16} color={OUTLINE} />
    </button>
  );
}

function PrimarySessionButton({
  state,
  starting,
  onClick,
}: {
  state: SessionState;
  starting: boolean;
  onClick: () => void;
}) {
  if (state === 'completed') {
    return (
      <button
        type="button"
        disabled
        style={{
          width: '100%',
          minHeight: '72px',
          padding: '0 24px',
          borderRadius: '28px',
          border: `1px solid ${OUTLINE_VARIANT}`,
          background: SURFACE_HIGH,
          color: OUTLINE,
          fontFamily: 'Manrope, sans-serif',
          fontWeight: 700,
          fontSize: '0.9rem',
          cursor: 'not-allowed',
        }}
      >
        Completed
      </button>
    );
  }

  const subLabel = state === 'resume' ? STATIC_RESUME_LABEL : STATIC_START_LABEL;
  const mainLabel = starting
    ? 'Starting...'
    : state === 'resume'
      ? 'Resume Workout'
      : 'Start Workout';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={starting}
      style={{
        width: '100%',
        minHeight: '110px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 28px',
        borderRadius: '28px',
        border: 'none',
        background: `linear-gradient(135deg, ${PRIMARY} 0%, ${TERTIARY} 100%)`,
        cursor: starting ? 'not-allowed' : 'pointer',
        boxShadow: `0 20px 60px -15px ${PRIMARY_GLOW}`,
        position: 'relative',
        overflow: 'hidden',
        opacity: starting ? 0.7 : 1,
        transition: 'transform 0.2s',
      }}
      onMouseEnter={(e) => { if (!starting) (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.99)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
    >
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,0,0.12), transparent)', pointerEvents: 'none' }} />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', zIndex: 1 }}>
        <span style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(17,19,24,0.7)', marginBottom: '4px' }}>
          {subLabel}
        </span>
        <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 'clamp(1.25rem, 4vw, 1.75rem)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.02em', color: SURFACE, lineHeight: 1 }}>
          {mainLabel}
        </span>
      </div>
      <div style={{ width: '60px', height: '60px', borderRadius: '9999px', backgroundColor: 'rgba(17,19,24,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 1 }}>
        <Play size={28} color={SURFACE} fill={SURFACE} style={{ marginLeft: '3px' }} />
      </div>
    </button>
  );
}

function QuickWorkoutSecondaryButton({
  standaloneActiveWorkout,
  onNavigate,
}: {
  standaloneActiveWorkout: ActiveWorkoutSummary | null;
  onNavigate: (href: string) => void;
}) {
  const isResume = !!standaloneActiveWorkout;
  const accent = isResume ? TERTIARY : OUTLINE;

  return (
    <button
      type="button"
      onClick={() =>
        onNavigate(
          isResume
            ? `/workout/${standaloneActiveWorkout!.id}`
            : '/quick-workout',
        )
      }
      style={{
        width: '100%',
        padding: '14px 0',
        borderRadius: 12,
        border: `1px solid ${isResume ? `${TERTIARY}55` : OUTLINE_VARIANT}`,
        background: isResume ? 'rgba(89,216,222,0.06)' : 'transparent',
        color: isResume ? TERTIARY : ON_SURFACE_VARIANT,
        fontFamily: 'Manrope, sans-serif',
        fontWeight: 700,
        fontSize: 13,
        letterSpacing: '0.04em',
        cursor: 'pointer',
      }}
    >
      <span style={{ display: 'block', fontSize: '0.55rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: accent, marginBottom: 4 }}>
        {isResume ? 'In progress' : 'Outside your block'}
      </span>
      {isResume ? 'Resume quick workout' : 'Quick Workout'}
    </button>
  );
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
        background: SURFACE_CONTAINER,
        border: `1px solid ${OUTLINE_VARIANT}`,
        borderLeft: `3px solid ${TERTIARY}`,
        borderRadius: 16,
        padding: '16px',
      }}
    >
      <p style={{ margin: '0 0 4px', fontSize: '0.57rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: TERTIARY, fontWeight: 700 }}>
        {template.primaryFocus}
      </p>
      <h3 style={{ margin: '0 0 8px', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, fontSize: 'clamp(1.1rem,4vw,1.3rem)', letterSpacing: '-0.035em', color: ON_SURFACE }}>
        {template.name}
      </h3>
      <p style={{ margin: 0, fontSize: 12, color: OUTLINE }}>
        {template.daysPerWeek} days/week · {template.durationWeeks} weeks · {template.level}
      </p>
    </button>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, hydrated, email, displayName, setDisplayName } = useAuthStore();

  const [mesocycle, setMesocycle] = useState<MesocycleActive | null>(null);
  const [program, setProgram] = useState<ExpandProgram | null>(null);
  const [activeWorkoutId, setActiveWorkoutId] = useState<string | null>(null);
  const [standaloneActiveWorkout, setStandaloneActiveWorkout] = useState<ActiveWorkoutSummary | null>(null);
  const [recentWorkouts, setRecentWorkouts] = useState<HistoryWorkout[]>([]);
  const [recentPrs, setRecentPrs] = useState<RecentPR[]>([]);
  const [recommended, setRecommended] = useState<TemplateListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  const userName = displayName ?? email?.split('@')[0] ?? 'Athlete';

  useEffect(() => {
    if (!hydrated) return;
    if (!isAuthenticated()) {
      router.push('/auth/login');
      return;
    }
    if (!displayName) {
      api.get('/api/v1/users/me').then((res) => {
        const name = res.data?.displayName;
        if (typeof name === 'string' && name.trim()) setDisplayName(name.trim());
      }).catch(() => {});
    }
    loadData();
  }, [hydrated]);

  function applyActiveWorkouts(active: ActiveWorkoutSummary[]) {
    const standalone = active.find((w) => w.sessionType === 'STANDALONE') ?? null;
    setStandaloneActiveWorkout(standalone);
    const blockWorkout = active.find((w) => w.sessionType !== 'STANDALONE');
    setActiveWorkoutId(blockWorkout?.id ?? null);
  }

  async function loadData() {
    try {
      const [mesoRes, activeRes] = await Promise.allSettled([
        mesocyclesApi.active(),
        workoutsApi.findActive(),
      ]);

      if (activeRes.status === 'fulfilled') {
        const active = Array.isArray(activeRes.value.data)
          ? activeRes.value.data as ActiveWorkoutSummary[]
          : [];
        applyActiveWorkouts(active);
      }

      const activeMeso = mesoRes.status === 'fulfilled'
        ? mesoRes.value.data as MesocycleActive | null
        : null;

      if (!activeMeso?.id) {
        const programs = await loadRecommendedPrograms();
        setRecommended(programs);
        setMesocycle(null);
        setProgram(null);
        return;
      }

      setMesocycle(activeMeso);

      const [expandRes, histRes, prsRes] = await Promise.allSettled([
        api.get(`/api/v1/mesocycles/${activeMeso.id}/expand`),
        workoutsApi.history(),
        api.get('/api/v1/prs/recent?limit=5'),
      ]);

      if (expandRes.status === 'fulfilled') setProgram(expandRes.value.data as ExpandProgram);

      if (histRes.status === 'fulfilled') {
        const history = Array.isArray(histRes.value.data) ? histRes.value.data as HistoryWorkout[] : [];
        setRecentWorkouts(history.slice(0, 3));
      }

      if (prsRes.status === 'fulfilled') {
        const prs = Array.isArray(prsRes.value.data) ? prsRes.value.data as RecentPR[] : [];
        setRecentPrs(prs.slice(0, 3));
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
        await workoutsApi.start(targetDay.id);
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
      <div style={{ minHeight: '100dvh', backgroundColor: SURFACE, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: OUTLINE, fontFamily: 'Manrope, sans-serif', fontSize: 13 }}>Loading...</p>
      </div>
    );
  }

  if (!mesocycle) {
    return (
      <div style={{ minHeight: '100dvh', backgroundColor: SURFACE, paddingBottom: 110 }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 20px' }}>
          <AppHeader />
          <main style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{
              background: SURFACE_CONTAINER,
              border: `1px solid ${OUTLINE_VARIANT}`,
              borderLeft: `3px solid ${PRIMARY}`,
              borderRadius: 16,
              padding: '24px 20px',
            }}>
              <p style={{ margin: '0 0 6px', color: OUTLINE, fontSize: '0.57rem', letterSpacing: '0.24em', textTransform: 'uppercase', fontWeight: 700 }}>
                Get Started
              </p>
              <h1 style={{ margin: '0 0 10px', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 900, fontSize: 'clamp(1.85rem,6vw,2.4rem)', letterSpacing: '-0.045em', color: ON_SURFACE }}>
                Set up your first training block
              </h1>
              <p style={{ margin: 0, fontSize: 13, color: ON_SURFACE_VARIANT, lineHeight: 1.6 }}>
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
            <QuickWorkoutSecondaryButton
              standaloneActiveWorkout={standaloneActiveWorkout}
              onNavigate={(href) => router.push(href)}
            />
          </main>
        </div>
      </div>
    );
  }

  const session = program
    ? deriveSessionState(program, activeWorkoutId)
    : { state: 'start' as SessionState, todayWorkout: null, nextWorkout: null, accent: PRIMARY };

  const displayDay = session.todayWorkout ?? session.nextWorkout;
  const dayLabel = displayDay?.dayLabel ?? displayDay?.sessionType ?? 'Training Session';
  const muscles = displayDay?.muscleSummary ?? (displayDay ? musclesFromLabel(dayLabel) : null);
  const count = exerciseCount(displayDay);
  const totalPlannedSessions = program?.weeks.reduce((sum, week) => sum + week.days.length, 0) ?? 0;
  const completedSessions = program?.weeks.reduce(
    (sum, week) => sum + week.days.filter((day) => day.completed).length,
    0,
  ) ?? 0;
  const progressPct = totalPlannedSessions > 0
    ? Math.min(100, Math.round((completedSessions / totalPlannedSessions) * 100))
    : mesocycle.totalWeeks > 0
      ? Math.round((mesocycle.currentWeek / mesocycle.totalWeeks) * 100)
      : 0;

  return (
    <div style={{ minHeight: '100dvh', backgroundColor: SURFACE, fontFamily: 'Manrope, sans-serif', color: ON_SURFACE, paddingBottom: 110 }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 20px' }}>
        <AppHeader />

        <main style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Compact hero */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <p style={{ margin: 0, fontSize: '0.6rem', fontWeight: 700, color: PRIMARY, letterSpacing: '0.22em', textTransform: 'uppercase' }}>
              {STATIC_TAGLINE}
            </p>
            <h1 style={{ margin: 0, fontFamily: "'Space Grotesk', sans-serif", fontSize: 'clamp(1.5rem, 5vw, 2.25rem)', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-0.025em', color: ON_SURFACE }}>
              Welcome, {userName}
            </h1>
            <p style={{ margin: 0, fontSize: '0.75rem', color: OUTLINE }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </section>

          {/* Today's Session */}
          <Card accentLeft={session.accent} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p style={{ margin: 0, fontSize: '0.57rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: session.accent, fontWeight: 700 }}>
              {session.state === 'rest' ? 'Rest Day' : "Today's Session"}
            </p>

            {session.state === 'rest' ? (
              <>
                <h2 style={{ margin: 0, fontFamily: 'Space Grotesk, sans-serif', fontWeight: 900, fontSize: 22, letterSpacing: '-0.04em', color: ON_SURFACE }}>
                  Rest Day
                </h2>
                <p style={{ margin: 0, fontSize: 13, color: ON_SURFACE_VARIANT, lineHeight: 1.6 }}>
                  Next session: {session.nextWorkout?.sessionType ?? '—'}
                </p>
              </>
            ) : (
              <>
                <div>
                  <h2 style={{ margin: '0 0 8px', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 900, fontSize: 22, letterSpacing: '-0.04em', color: ON_SURFACE }}>
                    {dayLabel}
                  </h2>
                  <p style={{ margin: '0 0 4px', fontSize: 13, color: ON_SURFACE_VARIANT }}>
                    Week {mesocycle.currentWeek} · Day {displayDay?.dayNumber ?? '—'}
                  </p>
                  {muscles && (
                    <p style={{ margin: '0 0 4px', fontSize: 12, color: OUTLINE }}>{muscles}</p>
                  )}
                  {count > 0 && (
                    <p style={{ margin: 0, fontSize: 12, color: OUTLINE }}>{count} exercises</p>
                  )}
                </div>
                <PrimarySessionButton
                  state={session.state}
                  starting={starting}
                  onClick={() => handleStartWorkout(session.todayWorkout ?? session.nextWorkout)}
                />
              </>
            )}
          </Card>

          <QuickWorkoutSecondaryButton
            standaloneActiveWorkout={standaloneActiveWorkout}
            onNavigate={(href) => router.push(href)}
          />

          {/* Program context — merged Active Block + Program Progress */}
          <button
            type="button"
            onClick={() => router.push(`/mesocycles/${mesocycle.id}`)}
            style={{
              width: '100%',
              textAlign: 'left',
              cursor: 'pointer',
              background: SURFACE_CONTAINER,
              border: `1px solid ${SURFACE_HIGH}`,
              borderLeft: `4px solid ${SECONDARY}`,
              borderRadius: 20,
              padding: '20px',
            }}
          >
            <SectionLabel>Active Block</SectionLabel>
            <p style={{ margin: '8px 0 4px', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, fontSize: '1.1rem', color: ON_SURFACE }}>
              {mesocycle.name}
            </p>
            <p style={{ margin: '0 0 12px', fontSize: '0.78rem', color: OUTLINE }}>
              Week {mesocycle.currentWeek} of {mesocycle.totalWeeks}
            </p>
            <div style={{ height: 5, backgroundColor: SURFACE_HIGH, borderRadius: 9999, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progressPct}%`, background: `linear-gradient(90deg, ${PRIMARY}, ${TERTIARY})`, borderRadius: 9999, boxShadow: `0 0 8px ${PRIMARY_GLOW}`, transition: 'width 0.6s ease' }} />
            </div>
          </button>

          {/* Supporting bento */}
          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>

            <Card style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <SectionLabel>Recent Sessions</SectionLabel>
                <button
                  type="button"
                  onClick={() => router.push('/history')}
                  style={{ background: 'none', border: 'none', color: PRIMARY, fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', padding: 0 }}
                >
                  View all
                </button>
              </div>
              {recentWorkouts.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {recentWorkouts.map((w, i) => (
                    <WorkoutRow
                      key={w.id}
                      label={w.splitDayLabel ?? 'Training Session'}
                      date={w.completedAt
                        ? new Date(w.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                        : '—'}
                      duration={w.durationMinutes ? `${w.durationMinutes} mins` : '–'}
                      accent={ROW_ACCENTS[i % ROW_ACCENTS.length]}
                      onClick={() => router.push('/history')}
                    />
                  ))}
                </div>
              ) : (
                <p style={{ margin: 0, fontSize: '0.75rem', color: OUTLINE, lineHeight: 1.5 }}>
                  Complete your first session to see history here.
                </p>
              )}
            </Card>

            <Card style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <SectionLabel>Milestones</SectionLabel>
                <Trophy size={16} color={SECONDARY} />
              </div>
              {recentPrs.length === 0 ? (
                <p style={{ margin: 0, fontSize: '0.75rem', color: OUTLINE, lineHeight: 1.5 }}>
                  Hit your first PR to see it here.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {recentPrs.map((pr) => (
                    <div
                      key={pr.id}
                      style={{
                        backgroundColor: SURFACE_HIGH,
                        borderRadius: 14,
                        padding: '12px 14px',
                        border: `1px solid ${PRIMARY}22`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 10,
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 800, color: ON_SURFACE }}>
                          {pr.exercise?.name ?? 'Exercise'}
                        </p>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: PRIMARY, backgroundColor: `${PRIMARY}1f`, border: `1px solid ${PRIMARY}44`, borderRadius: 9999, padding: '2px 8px' }}>
                            {pr.type}
                          </span>
                          <span style={{ fontSize: '0.56rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: OUTLINE, backgroundColor: `${OUTLINE}20`, border: `1px solid ${OUTLINE}33`, borderRadius: 9999, padding: '2px 8px' }}>
                            {scopeLabel(pr.scope)}
                          </span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ margin: 0, fontFamily: 'Space Grotesk, sans-serif', fontSize: '1rem', fontWeight: 900, color: ON_SURFACE }}>
                          {Number(pr.value).toFixed(1)}kg
                        </p>
                        <p style={{ margin: '2px 0 0', fontSize: '0.62rem', color: OUTLINE }}>
                          {formatRelativeDate(pr.achievedAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </section>

          {/* Analytics link — progress lives on /analytics per UX_POLICY */}
          <button
            type="button"
            onClick={() => router.push('/analytics')}
            style={{
              width: '100%',
              textAlign: 'left',
              cursor: 'pointer',
              background: 'transparent',
              border: `1px solid ${OUTLINE_VARIANT}`,
              borderRadius: 14,
              padding: '14px 18px',
              color: PRIMARY,
              fontFamily: 'Manrope, sans-serif',
              fontWeight: 700,
              fontSize: '0.75rem',
              letterSpacing: '0.06em',
            }}
          >
            View progress in Analytics →
          </button>

          <section style={{ position: 'relative', borderRadius: 28, overflow: 'hidden', minHeight: 320 }}>
            <img
              src={STATIC_MOTIVATION_IMAGE_URL}
              alt={STATIC_MOTIVATION_IMAGE_ALT}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(100%)', opacity: 0.35, mixBlendMode: 'luminosity' }}
            />
            <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to top, ${SURFACE} 40%, ${SURFACE}cc 65%, transparent 100%)` }} />
            <div style={{ position: 'relative', padding: '40px 32px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', minHeight: 320 }}>
              <span style={{ fontSize: '0.6rem', fontWeight: 700, color: `${PRIMARY}cc`, letterSpacing: '0.4em', textTransform: 'uppercase', display: 'block', marginBottom: 12 }}>
                {STATIC_PHILOSOPHY_LABEL}
              </span>
              <h2 style={{ margin: 0, fontFamily: "'Space Grotesk', sans-serif", fontSize: 'clamp(1.1rem, 3.5vw, 1.75rem)', fontWeight: 900, lineHeight: 1.15, letterSpacing: '-0.01em', textTransform: 'uppercase', fontStyle: 'italic', color: ON_SURFACE, maxWidth: 680 }}>
                {STATIC_PHILOSOPHY_HEADLINE}
              </h2>
            </div>
          </section>

        </main>
      </div>
    </div>
  );
}
