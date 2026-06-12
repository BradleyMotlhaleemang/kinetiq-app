'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { workoutsApi } from '@/lib/api/workouts';
import { ApiError } from '@/lib/api/client';
import { Dumbbell } from 'lucide-react';

// ── COLOUR TOKENS ────────────────────────────────────────────────
const C = {
  primary:          '#b1c5ff',
  secondary:        '#d4bbff',
  tertiary:         '#59d8de',
  surface:          '#111318',
  surfaceLow:       '#161820',
  surfaceContainer: '#1e2026',
  surfaceHigh:      '#282a30',
  surfaceHighest:   '#32343c',
  outline:          '#8e909c',
  outlineVariant:   '#3a3c44',
  onSurface:        '#e2e2e8',
  onSurfaceVariant: '#c5c6d2',
  glass:            'rgba(22,24,32,0.80)',
};

const DAY_COLORS = ['#b1c5ff', '#59d8de', '#d4bbff', '#a2e7ff'];

// ── LOGO ─────────────────────────────────────────────────────────
function KinetiqLogoWithTealQ() {
  return (
    <span style={{
      fontFamily: 'Space Grotesk, sans-serif',
      fontWeight: 900,
      fontSize: 20,
      letterSpacing: '-0.04em',
    }}>
      <span style={{
        background: 'linear-gradient(90deg, #b1c5ff, #d4bbff)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }}>
        Kineti
      </span>
      <span style={{ color: '#59d8de' }}>q</span>
    </span>
  );
}

// ── STAT PILL ────────────────────────────────────────────────────
function StatPill({
  value,
  label,
}: {
  value: string | number;
  label: string;
}) {
  return (
    <div style={{
      flex: 1,
      background: C.surfaceHigh,
      borderRadius: 10,
      padding: '10px 8px',
      textAlign: 'center',
    }}>
      <span style={{
        display: 'block',
        fontFamily: 'Space Grotesk, sans-serif',
        fontWeight: 800,
        fontSize: 15,
        color: C.onSurface,
        letterSpacing: '-0.02em',
      }}>
        {value}
      </span>
      <span style={{
        display: 'block',
        fontSize: '0.52rem',
        fontWeight: 700,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        color: C.outline,
        marginTop: 3,
      }}>
        {label}
      </span>
    </div>
  );
}

type SessionFilter = 'ALL' | 'BLOCK' | 'QUICK';

// ── WORKOUT CARD ─────────────────────────────────────────────────
function WorkoutCard({ workout, index }: { workout: any; index: number }) {
  const [expanded, setExpanded] = useState(false);

  const date    = new Date(workout.completedAt);
  const dateStr = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const accent = DAY_COLORS[index % DAY_COLORS.length];
  const sets = workout.sets ?? [];
  const uniqueExerciseCount = new Set(sets.map((s: { exerciseId?: string }) => s.exerciseId)).size;
  const isQuick = workout.sessionType === 'STANDALONE';
  const highlights = sets
    .filter((s: { isPR?: boolean }) => s.isPR)
    .slice(0, 3);
  const topByWeight = [...sets].sort((a: { weight?: number }, b: { weight?: number }) => (b.weight ?? 0) - (a.weight ?? 0));
  const displayHighlights = highlights.length > 0
    ? highlights
    : topByWeight.slice(0, 3);
  const hasHighlights = displayHighlights.length > 0;
  const topWeight = topByWeight[0]?.weight ?? 0;
  const sessionTitle = isQuick
    ? `${uniqueExerciseCount} exercise${uniqueExerciseCount === 1 ? '' : 's'} · ${topWeight}kg top`
    : (workout.splitDayLabel ?? 'Training Session');

  return (
    <div style={{
      background: C.surfaceContainer,
      border: `1px solid ${C.outlineVariant}`,
      borderLeft: `3px solid ${accent}`,
      borderRadius: 16,
      overflow: 'hidden',
    }}>

      {/* ── CARD HEADER ── */}
      <div
        style={{
          padding: '14px 16px',
          cursor: hasHighlights ? 'pointer' : 'default',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
        onClick={() => hasHighlights && setExpanded((e) => !e)}
      >
        {/* Left — icon + labels */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: `rgba(${hexToRgb(accent)}, 0.1)`,
            border: `1px solid rgba(${hexToRgb(accent)}, 0.25)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Dumbbell size={16} color={accent} />
          </div>

          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: isQuick ? 4 : 0, flexWrap: 'wrap' }}>
              {isQuick && (
                <span style={{
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: '#002021',
                  background: C.tertiary,
                  padding: '2px 6px',
                  borderRadius: 4,
                  flexShrink: 0,
                }}>
                  Quick
                </span>
              )}
              <p style={{
                fontFamily: 'Space Grotesk, sans-serif',
                fontWeight: 800,
                fontSize: 13,
                color: C.onSurface,
                margin: 0,
                letterSpacing: '-0.01em',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {sessionTitle}
              </p>
            </div>
            <p style={{
              fontFamily: 'Manrope, sans-serif',
              fontWeight: 500,
              fontSize: 11,
              color: C.outline,
              margin: '2px 0 0',
            }}>
              {dateStr} · {timeStr}
            </p>
          </div>
        </div>

        {/* Right — chevron if expandable */}
        {hasHighlights && (
          <div style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: expanded ? `rgba(${hexToRgb(accent)}, 0.12)` : C.surfaceHigh,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'background 0.2s ease',
          }}>
            <svg
              width="13"
              height="13"
              viewBox="0 0 13 13"
              fill="none"
              style={{
                transform: expanded ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.25s ease',
              }}
            >
              <path
                d="M2 4.5L6.5 9L11 4.5"
                stroke={expanded ? accent : C.outline}
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        )}
      </div>

      {/* ── STAT PILLS ── */}
      <div style={{
        display: 'flex',
        gap: 8,
        padding: '0 16px 14px',
      }}>
        <StatPill value={workout.totalSets ?? sets.length}           label="Sets"      />
        <StatPill value={Math.round(workout.totalVolume ?? 0)}       label="Vol (kg)"  />
        <StatPill value={uniqueExerciseCount}                        label="Exercises" />
      </div>

      {/* ── EXPANDED TOP SETS ── */}
      {expanded && hasHighlights && (
        <div style={{
          padding: '12px 16px 14px',
          borderTop: `1px solid ${C.outlineVariant}`,
        }}>
          <p style={{
            fontSize: '0.57rem',
            fontWeight: 700,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: C.outline,
            margin: '0 0 10px',
          }}>
            Session Highlights
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {displayHighlights.map((set: any, i: number) => (
              <div
                key={set.id ?? i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: C.surfaceHigh,
                  borderRadius: 8,
                  padding: '8px 12px',
                }}
              >
                <span style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: accent,
                  background: `rgba(${hexToRgb(accent)}, 0.1)`,
                  borderRadius: 5,
                  padding: '2px 7px',
                }}>
                  {set.isPR ? 'PR' : 'Top'}
                </span>

                <span style={{
                  fontFamily: 'Manrope, sans-serif',
                  fontWeight: 600,
                  fontSize: 11,
                  color: C.onSurfaceVariant,
                  flex: 1,
                  marginLeft: 8,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {set.exercise?.name ?? 'Exercise'}
                </span>

                <span style={{
                  fontFamily: 'Space Grotesk, sans-serif',
                  fontWeight: 800,
                  fontSize: 12,
                  color: C.onSurface,
                  letterSpacing: '-0.01em',
                }}>
                  {set.weight}kg × {set.reps}
                </span>

                {/* e1RM */}
                <div style={{ textAlign: 'right' }}>
                  <span style={{
                    display: 'block',
                    fontSize: '0.52rem',
                    fontWeight: 700,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: C.outline,
                  }}>
                    e1RM
                  </span>
                  <span style={{
                    display: 'block',
                    fontFamily: 'Space Grotesk, sans-serif',
                    fontWeight: 800,
                    fontSize: 12,
                    color: C.tertiary,
                    letterSpacing: '-0.01em',
                  }}>
                    {Math.round(set.e1rm ?? 0)}kg
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── UTILITY ──────────────────────────────────────────────────────
function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '177,197,255';
  return `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}`;
}

// ── PAGE ─────────────────────────────────────────────────────────
const FILTER_OPTIONS: { id: SessionFilter; label: string }[] = [
  { id: 'ALL', label: 'All' },
  { id: 'BLOCK', label: 'Block' },
  { id: 'QUICK', label: 'Quick' },
];

export default function HistoryPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [sessionFilter, setSessionFilter] = useState<SessionFilter>('ALL');

  useEffect(() => {
    if (!isAuthenticated()) { router.push('/auth/login'); return; }
    loadHistory();
  }, []);

  async function loadHistory() {
    try {
      const res = await workoutsApi.history();
      setWorkouts(res.data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setWorkouts([]);
        return;
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // ── LOADING ──
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: C.surface,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <p style={{
          fontFamily: 'Manrope, sans-serif',
          fontSize: 13,
          color: C.outline,
        }}>
          Loading history...
        </p>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: C.surface,
      color: C.onSurface,
      fontFamily: 'Manrope, sans-serif',
      paddingBottom: 110,
      overflowX: 'hidden',
    }}>

      {/* ── STICKY GLASS HEADER ── */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        height: 58,
        background: C.glass,
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: `1px solid ${C.outlineVariant}`,
      }}>
        <KinetiqLogoWithTealQ />
        {/* Session count badge */}
        {workouts.length > 0 && (
          <div style={{
            background: C.surfaceHigh,
            borderRadius: 100,
            padding: '4px 10px',
            border: `1px solid ${C.outlineVariant}`,
          }}>
            <span style={{
              fontFamily: 'Manrope, sans-serif',
              fontSize: '0.57rem',
              fontWeight: 700,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: C.outline,
            }}>
              {workouts.length} sessions
            </span>
          </div>
        )}
      </header>

      {/* ── PAGE CONTENT ── */}
      <div style={{
        maxWidth: 600,
        margin: '0 auto',
        padding: '26px 16px 0',
      }}>

        {/* Micro label */}
        <p style={{
          margin: '0 0 6px',
          fontSize: '0.57rem',
          letterSpacing: '0.24em',
          textTransform: 'uppercase',
          color: C.outline,
          fontWeight: 700,
        }}>
          Training Log
        </p>

        {/* Page title */}
        <h1 style={{
          fontFamily: 'Space Grotesk, sans-serif',
          fontWeight: 900,
          fontSize: 'clamp(1.85rem,6vw,2.4rem)',
          letterSpacing: '-0.045em',
          lineHeight: 1.05,
          color: C.onSurface,
          margin: '0 0 4px',
        }}>
          History
        </h1>
        <p style={{
          fontFamily: 'Manrope, sans-serif',
          fontSize: 13,
          fontWeight: 500,
          color: C.outline,
          margin: '0 0 16px',
        }}>
          {workouts.length} completed session{workouts.length !== 1 ? 's' : ''}
        </p>

        {workouts.length > 0 && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
            {FILTER_OPTIONS.map((option) => {
              const active = sessionFilter === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setSessionFilter(option.id)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 9999,
                    border: `1px solid ${active ? C.primary : C.outlineVariant}`,
                    background: active ? 'rgba(177,197,255,0.1)' : C.surfaceHigh,
                    color: active ? C.primary : C.onSurfaceVariant,
                    fontFamily: 'Manrope, sans-serif',
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                  }}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        )}

        {/* ── EMPTY STATE ── */}
        {workouts.length === 0 ? (
          <div style={{
            background: C.surfaceContainer,
            border: `1px solid ${C.outlineVariant}`,
            borderRadius: 16,
            padding: '40px 24px',
            textAlign: 'center',
          }}>
            <div style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: C.surfaceHigh,
              border: `1px solid ${C.outlineVariant}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px',
            }}>
              <Dumbbell size={22} color={C.outline} />
            </div>
            <p style={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontWeight: 800,
              fontSize: 14,
              color: C.onSurface,
              margin: '0 0 4px',
            }}>
              No sessions yet
            </p>
            <p style={{
              fontFamily: 'Manrope, sans-serif',
              fontSize: 12,
              fontWeight: 500,
              color: C.outline,
              margin: '0 0 20px',
            }}>
              Complete your first session to see it here
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              style={{
                padding: '11px 28px',
                borderRadius: 12,
                border: 'none',
                background: 'linear-gradient(135deg, #b1c5ff 0%, #3a5cbf 100%)',
                color: '#05080f',
                fontFamily: 'Space Grotesk, sans-serif',
                fontWeight: 900,
                fontSize: 13,
                letterSpacing: '0.01em',
                cursor: 'pointer',
              }}
            >
              Start Training →
            </button>
          </div>
        ) : (() => {
          const filtered = workouts.filter((workout) => {
            if (sessionFilter === 'ALL') return true;
            if (sessionFilter === 'QUICK') return workout.sessionType === 'STANDALONE';
            return workout.sessionType !== 'STANDALONE';
          });

          if (filtered.length === 0) {
            return (
              <p style={{
                fontFamily: 'Manrope, sans-serif',
                fontSize: 13,
                color: C.outline,
                margin: 0,
                padding: '24px 0',
              }}>
                No {sessionFilter === 'QUICK' ? 'quick' : 'block'} sessions yet.
              </p>
            );
          }

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filtered.map((workout, index) => (
                <WorkoutCard key={workout.id} workout={workout} index={index} />
              ))}
            </div>
          );
        })()}
      </div>
    </div>
  );
}