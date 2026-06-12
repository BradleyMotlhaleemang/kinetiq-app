'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, MoreVertical } from 'lucide-react';
import api from '@/lib/api/client';
import { mesocyclesApi } from '@/lib/api/mesocycles';
import { templatesApi } from '@/lib/api/templates';
import {
  type ExpandProgram,
  type WeekOneWorkout,
  computeSessionProgress,
  computeTodayDayNumber,
  deriveWeekOneDayLetters,
  formatGoalLabel,
  startMesocycleSession,
} from '@/lib/programs/sessionNavigation';
import { TYPE } from '@/lib/design/typography';

const C = {
  primary: '#b1c5ff',
  primaryFixedDim: '#b1c5ff',
  surface: '#111318',
  surfaceContainer: '#1e2026',
  surfaceHigh: '#282a30',
  outline: '#8e909c',
  outlineVariant: '#3a3c44',
  onSurface: '#e2e2e8',
  onSurfaceVariant: '#c5c6d2',
  onPrimary: '#182e5f',
};

export type ActiveMesocycleSummary = {
  id: string;
  name?: string;
  status?: string;
  currentWeek?: number;
  totalWeeks?: number;
  splitTemplateId?: string;
  workouts?: WeekOneWorkout[];
};

type ActiveMesocycleCardProps = {
  mesocycle: ActiveMesocycleSummary;
  onUpdated?: () => void;
};

export default function ActiveMesocycleCard({ mesocycle, onUpdated }: ActiveMesocycleCardProps) {
  const router = useRouter();
  const [program, setProgram] = useState<ExpandProgram | null>(null);
  const [programLoading, setProgramLoading] = useState(true);
  const [goalLabel, setGoalLabel] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setProgramLoading(true);
      try {
        const [expandRes, templateRes] = await Promise.allSettled([
          api.get(`/api/v1/mesocycles/${mesocycle.id}/expand`),
          mesocycle.splitTemplateId
            ? templatesApi.findOne(mesocycle.splitTemplateId)
            : Promise.reject(new Error('no template')),
        ]);

        if (!cancelled && expandRes.status === 'fulfilled') {
          setProgram(expandRes.value.data as ExpandProgram);
        }

        if (!cancelled && templateRes.status === 'fulfilled') {
          const template = templateRes.value.data as { primaryFocus?: string; goal?: string };
          setGoalLabel(template.primaryFocus ?? formatGoalLabel(template.goal));
        }
      } catch {
        // silent — card falls back to week-based progress
      } finally {
        if (!cancelled) setProgramLoading(false);
      }
    }

    void load();
    return () => { cancelled = true; };
  }, [mesocycle.id, mesocycle.splitTemplateId]);

  const currentWeek = mesocycle.currentWeek ?? program?.currentWeek ?? 0;
  const totalWeeks = mesocycle.totalWeeks ?? program?.totalWeeks ?? program?.weekCount ?? 0;
  const sessionProgress = computeSessionProgress(program);
  const progressPct = sessionProgress.total > 0
    ? sessionProgress.pct
    : totalWeeks > 0
      ? Math.round((currentWeek / totalWeeks) * 100)
      : 0;

  const dayLetters = deriveWeekOneDayLetters(mesocycle.workouts ?? []);
  const todayDayNumber = program
    ? computeTodayDayNumber(program.startDate, program.currentWeek)
    : null;

  const titleSuffix = goalLabel ? ` · ${goalLabel}` : '';

  async function handleResume(e: React.MouseEvent) {
    e.stopPropagation();
    if (!program || starting) return;
    setStarting(true);
    try {
      const workoutId = await startMesocycleSession(mesocycle.id, program);
      router.push(`/workout/${workoutId}`);
    } catch (err) {
      console.error('Failed to resume session', err);
    } finally {
      setStarting(false);
    }
  }

  async function handleCloseBlock() {
    if (closing) return;
    setClosing(true);
    try {
      await mesocyclesApi.close(mesocycle.id);
      setMenuOpen(false);
      onUpdated?.();
    } catch (err) {
      console.error('Failed to close block', err);
    } finally {
      setClosing(false);
    }
  }

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => router.push(`/mesocycles/${mesocycle.id}`)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            router.push(`/mesocycles/${mesocycle.id}`);
          }
        }}
        style={{
          position: 'relative',
          background: C.surfaceContainer,
          border: `1px solid ${C.outlineVariant}`,
          borderRadius: 12,
          padding: 16,
          marginBottom: 24,
          overflow: 'hidden',
          cursor: 'pointer',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 4,
            background: C.primaryFixedDim,
          }}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div>
            <span
              style={{
                display: 'block',
                marginBottom: 4,
                ...TYPE.labelCaps,
                color: C.primaryFixedDim,
              }}
            >
              Active Mesocycle
            </span>
            <h2
              style={{
                margin: 0,
                ...TYPE.headlineSm,
                color: C.onSurface,
              }}
            >
              Week {currentWeek} of {totalWeeks}
              {titleSuffix}
            </h2>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(true);
            }}
            style={{
              background: 'none',
              border: 'none',
              padding: 4,
              cursor: 'pointer',
              color: C.onSurfaceVariant,
              display: 'flex',
              alignItems: 'center',
            }}
            aria-label="More options"
          >
            <MoreVertical size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
          <div
            style={{
              flex: 1,
              height: 8,
              background: C.surfaceHigh,
              borderRadius: 9999,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${progressPct}%`,
                background: 'linear-gradient(135deg, #b1c5ff 0%, #3a5cbf 100%)',
                borderRadius: 9999,
                transition: 'width 0.3s ease',
              }}
            />
          </div>
          <span style={{ ...TYPE.labelMeta, color: C.onSurfaceVariant, flexShrink: 0 }}>
            {progressPct}%
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
          <div style={{ display: 'flex' }}>
            {dayLetters.map((letter, index) => {
              const isToday = todayDayNumber !== null && index + 1 === todayDayNumber;
              const isPast = todayDayNumber !== null && index + 1 < todayDayNumber;
              return (
                <div
                  key={`${letter}-${index}`}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    border: `2px solid ${C.surfaceContainer}`,
                    marginLeft: index > 0 ? -8 : 0,
                    background: isToday ? C.primary : C.surfaceHigh,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    ...TYPE.chipLabel,
                    color: isToday ? C.onPrimary : isPast ? C.outline : C.onSurfaceVariant,
                    zIndex: dayLetters.length - index,
                    position: 'relative',
                  }}
                >
                  {letter}
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleResume}
            disabled={starting || programLoading || !program}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: starting || programLoading || !program ? 'default' : 'pointer',
              opacity: starting || programLoading || !program ? 0.6 : 1,
              ...TYPE.titleCta,
              color: C.primaryFixedDim,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            {starting ? 'Starting…' : programLoading ? 'Loading…' : 'Resume Session'}
            {!starting && !programLoading && <ArrowRight size={16} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 80,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
          }}
        >
          <div
            style={{ position: 'absolute', inset: 0, background: 'rgba(8,10,16,0.85)' }}
            onClick={() => setMenuOpen(false)}
          />
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: 560,
              background: C.surfaceContainer,
              borderRadius: '20px 20px 0 0',
              border: `1px solid ${C.outlineVariant}`,
              padding: 20,
            }}
          >
            <p
              style={{
                margin: '0 0 12px',
                ...TYPE.headlineSm,
                color: C.onSurface,
              }}
            >
              {mesocycle.name ?? 'Active Block'}
            </p>
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                router.push(`/mesocycles/${mesocycle.id}`);
              }}
              style={menuBtnStyle(false)}
            >
              View program
            </button>
            <button
              type="button"
              onClick={() => void handleCloseBlock()}
              disabled={closing}
              style={menuBtnStyle(true)}
            >
              {closing ? 'Closing…' : 'Mark block complete'}
            </button>
            <button type="button" onClick={() => setMenuOpen(false)} style={menuBtnStyle(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function menuBtnStyle(destructive: boolean): React.CSSProperties {
  return {
    width: '100%',
    padding: '13px 0',
    borderRadius: 12,
    border: destructive ? 'none' : `1px solid ${C.outlineVariant}`,
    background: destructive ? 'linear-gradient(135deg, #ff8b8b 0%, #c44 100%)' : 'transparent',
    color: destructive ? '#05080f' : C.onSurfaceVariant,
    ...TYPE.labelMeta,
    fontWeight: 700,
    fontSize: 13,
    cursor: 'pointer',
    marginBottom: 8,
  };
}
