'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api/client';
import { TrendingUp, BarChart2, Zap } from 'lucide-react';

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
  red:              '#ff6b6b',
  amber:            '#ffb347',
  green:            '#59d8a0',
};

const DAY_COLORS = ['#b1c5ff', '#59d8de', '#d4bbff', '#a2e7ff'];

// ── UTILITY ──────────────────────────────────────────────────────
function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '177,197,255';
  return `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}`;
}

function statusColor(status: string): string {
  if (status === 'BELOW_MEV') return C.red;
  if (status === 'ABOVE_MRV') return C.amber;
  return C.green;
}

function statusLabel(status: string): string {
  if (status === 'BELOW_MEV') return 'Below MEV';
  if (status === 'ABOVE_MRV') return 'Above MRV';
  return 'Optimal';
}

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

// ── SECTION CARD WRAPPER ─────────────────────────────────────────
function SectionCard({
  accent,
  icon,
  title,
  children,
}: {
  accent: string;
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{
      background: C.surfaceContainer,
      border: `1px solid ${C.outlineVariant}`,
      borderLeft: `3px solid ${accent}`,
      borderRadius: 16,
      overflow: 'hidden',
    }}>
      {/* Card header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '11px 16px',
        background: C.surfaceHigh,
        borderBottom: `1px solid ${C.outlineVariant}`,
      }}>
        {icon}
        <p style={{
          fontFamily: 'Space Grotesk, sans-serif',
          fontWeight: 800,
          fontSize: 13,
          color: C.onSurface,
          margin: 0,
          letterSpacing: '-0.01em',
        }}>
          {title}
        </p>
      </div>
      {children}
    </div>
  );
}

// ── VOLUME BAR ROW ───────────────────────────────────────────────
function VolumeRow({ item }: { item: any }) {
  const color    = statusColor(item.status);
  const pct      = Math.min((item.setsThisWeek / item.mrv) * 100, 100);
  const muscleLbl = (item.muscle as string).replace(/_/g, ' ');

  return (
    <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C.outlineVariant}` }}>
      {/* Row top */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
      }}>
        <p style={{
          fontFamily: 'Space Grotesk, sans-serif',
          fontWeight: 800,
          fontSize: 12,
          color: C.onSurface,
          margin: 0,
          textTransform: 'capitalize',
          letterSpacing: '-0.01em',
        }}>
          {muscleLbl}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Status pill */}
          <span style={{
            fontSize: '0.52rem',
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color,
            background: `rgba(${hexToRgb(color)}, 0.1)`,
            borderRadius: 5,
            padding: '2px 7px',
          }}>
            {statusLabel(item.status)}
          </span>
          {/* Set count */}
          <span style={{
            fontFamily: 'Space Grotesk, sans-serif',
            fontWeight: 800,
            fontSize: 12,
            color,
          }}>
            {item.setsThisWeek} sets
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{
        height: 5,
        background: C.surfaceHigh,
        borderRadius: 100,
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          borderRadius: 100,
          background: color,
          transition: 'width 0.4s ease',
        }} />
      </div>

      {/* MEV / MRV labels */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: 5,
      }}>
        <span style={{
          fontSize: '0.52rem',
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: C.outline,
        }}>
          MEV {item.mev}
        </span>
        <span style={{
          fontSize: '0.52rem',
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: C.outline,
        }}>
          MRV {item.mrv}
        </span>
      </div>
    </div>
  );
}

// ── LIFT ROW ─────────────────────────────────────────────────────
function LiftRow({ lift, accent }: { lift: any; accent: string }) {
  const latest   = lift.history[lift.history.length - 1];
  const previous = lift.history[lift.history.length - 2];
  const trend    = latest && previous ? latest.bestE1rm - previous.bestE1rm : 0;
  const trendColor = trend > 0 ? C.green : trend < 0 ? C.red : C.outline;
  const trendSign  = trend > 0 ? '+' : '';

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '13px 16px',
      borderBottom: `1px solid ${C.outlineVariant}`,
      gap: 12,
    }}>
      {/* Left */}
      <div style={{ flex: 1, minWidth: 0 }}>
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
          {lift.exercise}
        </p>
        <p style={{
          fontFamily: 'Manrope, sans-serif',
          fontWeight: 500,
          fontSize: 11,
          color: C.outline,
          margin: '2px 0 0',
        }}>
          {lift.history.length} session{lift.history.length !== 1 ? 's' : ''} logged
        </p>
      </div>

      {/* Right — e1RM + trend */}
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        {latest ? (
          <>
            <p style={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontWeight: 900,
              fontSize: 15,
              color: C.onSurface,
              margin: 0,
              letterSpacing: '-0.02em',
            }}>
              {Math.round(latest.bestE1rm)}kg
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 2 }}>
              {trend !== 0 && (
                <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                  <path
                    d={trend > 0 ? 'M4.5 7V2M2 4.5L4.5 2L7 4.5' : 'M4.5 2v5M2 4.5L4.5 7L7 4.5'}
                    stroke={trendColor}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
              <span style={{
                fontFamily: 'Manrope, sans-serif',
                fontSize: 11,
                fontWeight: 700,
                color: trendColor,
              }}>
                {trendSign}{Math.round(trend)}kg e1RM
              </span>
            </div>
          </>
        ) : (
          <span style={{
            fontFamily: 'Manrope, sans-serif',
            fontSize: 11,
            fontWeight: 500,
            color: C.outline,
          }}>
            No data yet
          </span>
        )}
      </div>
    </div>
  );
}

// ── PLATEAU ROW ──────────────────────────────────────────────────
function PlateauRow({ plateau }: { plateau: any }) {
  return (
    <div style={{
      padding: '13px 16px',
      borderBottom: `1px solid ${C.outlineVariant}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        {/* Warning dot */}
        <div style={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: C.amber,
          flexShrink: 0,
        }} />
        <span style={{
          fontFamily: 'Space Grotesk, sans-serif',
          fontWeight: 800,
          fontSize: 12,
          color: C.amber,
          letterSpacing: '-0.01em',
        }}>
          Plateau detected
        </span>
      </div>
      <p style={{
        fontFamily: 'Space Grotesk, sans-serif',
        fontWeight: 800,
        fontSize: 13,
        color: C.onSurface,
        margin: '0 0 3px 15px',
        letterSpacing: '-0.01em',
      }}>
        {plateau.exercise?.name}
      </p>
      <p style={{
        fontFamily: 'Manrope, sans-serif',
        fontWeight: 500,
        fontSize: 12,
        color: C.onSurfaceVariant,
        margin: '0 0 0 15px',
      }}>
        {plateau.reason}
      </p>
    </div>
  );
}

// ── PAGE ─────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [strengthTrends, setStrengthTrends] = useState<any[]>([]);
  const [weeklyVolume, setWeeklyVolume]     = useState<any[]>([]);
  const [insights, setInsights]             = useState<any>(null);
  const [loading, setLoading]               = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) { router.push('/auth/login'); return; }
    loadData();
  }, []);

  async function loadData() {
    try {
      const [strengthRes, volumeRes, insightsRes] = await Promise.allSettled([
        api.get('/api/v1/analytics/strength/trends'),
        api.get('/api/v1/analytics/volume/weekly'),
        api.get('/api/v1/analytics/insights'),
      ]);
      if (strengthRes.status === 'fulfilled') setStrengthTrends(strengthRes.value.data);
      if (volumeRes.status === 'fulfilled')   setWeeklyVolume(volumeRes.value.data);
      if (insightsRes.status === 'fulfilled') setInsights(insightsRes.value.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const hasNoData =
    weeklyVolume.length === 0 &&
    strengthTrends.every((t) => t.history.length === 0);

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
        <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: 13, color: C.outline }}>
          Loading analytics...
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
        {/* Right slot — muted label */}
        <span style={{
          fontFamily: 'Manrope, sans-serif',
          fontSize: '0.57rem',
          fontWeight: 700,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: C.outline,
        }}>
          Stats
        </span>
      </header>

      {/* ── CONTENT ── */}
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '26px 16px 0' }}>

        {/* Micro label */}
        <p style={{
          margin: '0 0 6px',
          fontSize: '0.57rem',
          letterSpacing: '0.24em',
          textTransform: 'uppercase',
          color: C.outline,
          fontWeight: 700,
        }}>
          Performance
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
          Analytics
        </h1>
        <p style={{
          fontFamily: 'Manrope, sans-serif',
          fontSize: 13,
          fontWeight: 500,
          color: C.outline,
          margin: '0 0 22px',
        }}>
          Your performance overview
        </p>

        {/* ── EMPTY STATE ── */}
        {hasNoData && (
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
              <BarChart2 size={22} color={C.outline} />
            </div>
            <p style={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontWeight: 800,
              fontSize: 14,
              color: C.onSurface,
              margin: '0 0 4px',
            }}>
              No data yet
            </p>
            <p style={{
              fontFamily: 'Manrope, sans-serif',
              fontSize: 12,
              fontWeight: 500,
              color: C.outline,
              margin: 0,
            }}>
              Complete sessions to see your analytics
            </p>
          </div>
        )}

        {/* ── SECTIONS ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Weekly Volume */}
          {weeklyVolume.length > 0 && (
            <SectionCard
              accent={C.tertiary}
              icon={<BarChart2 size={15} color={C.tertiary} />}
              title="Weekly Volume"
            >
              {/* Remove bottom border on last row */}
              {weeklyVolume.map((item: any, i: number) => (
                <div
                  key={item.muscle}
                  style={i === weeklyVolume.length - 1
                    ? { padding: '12px 16px' }
                    : undefined
                  }
                >
                  {i === weeklyVolume.length - 1 ? (
                    // Last item — no bottom border
                    <div>
                      {/* Reuse VolumeRow internals inline for last item */}
                      <div style={{ padding: '0' }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: 8,
                        }}>
                          <p style={{
                            fontFamily: 'Space Grotesk, sans-serif',
                            fontWeight: 800,
                            fontSize: 12,
                            color: C.onSurface,
                            margin: 0,
                            textTransform: 'capitalize',
                            letterSpacing: '-0.01em',
                          }}>
                            {(item.muscle as string).replace(/_/g, ' ')}
                          </p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{
                              fontSize: '0.52rem',
                              fontWeight: 700,
                              letterSpacing: '0.14em',
                              textTransform: 'uppercase',
                              color: statusColor(item.status),
                              background: `rgba(${hexToRgb(statusColor(item.status))}, 0.1)`,
                              borderRadius: 5,
                              padding: '2px 7px',
                            }}>
                              {statusLabel(item.status)}
                            </span>
                            <span style={{
                              fontFamily: 'Space Grotesk, sans-serif',
                              fontWeight: 800,
                              fontSize: 12,
                              color: statusColor(item.status),
                            }}>
                              {item.setsThisWeek} sets
                            </span>
                          </div>
                        </div>
                        <div style={{ height: 5, background: C.surfaceHigh, borderRadius: 100, overflow: 'hidden' }}>
                          <div style={{
                            height: '100%',
                            width: `${Math.min((item.setsThisWeek / item.mrv) * 100, 100)}%`,
                            borderRadius: 100,
                            background: statusColor(item.status),
                          }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
                          <span style={{ fontSize: '0.52rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.outline }}>MEV {item.mev}</span>
                          <span style={{ fontSize: '0.52rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.outline }}>MRV {item.mrv}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <VolumeRow item={item} />
                  )}
                </div>
              ))}
            </SectionCard>
          )}

          {/* Key Lifts */}
          {strengthTrends.length > 0 && (
            <SectionCard
              accent={C.primary}
              icon={<TrendingUp size={15} color={C.primary} />}
              title="Key Lifts"
            >
              {strengthTrends.map((lift: any, i: number) => (
                <div
                  key={lift.exercise}
                  style={i === strengthTrends.length - 1
                    ? { borderBottom: 'none' }
                    : undefined
                  }
                >
                  <LiftRow
                    lift={lift}
                    accent={DAY_COLORS[i % DAY_COLORS.length]}
                  />
                </div>
              ))}
            </SectionCard>
          )}

          {/* Coaching Insights */}
          {insights && insights.plateaus?.length > 0 && (
            <SectionCard
              accent={C.amber}
              icon={<Zap size={15} color={C.amber} />}
              title="Coaching Insights"
            >
              {insights.plateaus.map((plateau: any, i: number) => (
                <div
                  key={plateau.id}
                  style={i === insights.plateaus.length - 1
                    ? { borderBottom: 'none' }
                    : undefined
                  }
                >
                  <PlateauRow plateau={plateau} />
                </div>
              ))}
            </SectionCard>
          )}

        </div>
      </div>
    </div>
  );
}