'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import api, { ApiError } from '@/lib/api/client';
import { BarChart2, TrendingUp, Zap } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  LineChart,
  Line,
} from 'recharts';

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
  glass: 'rgba(22,24,32,0.80)',
  red: '#ef4444',
  amber: '#f59e0b',
  green: '#59d8de',
};

const TABS = ['Volume', 'Trends', 'Strength', 'Insights', 'SFR'] as const;
type AnalyticsTab = (typeof TABS)[number];

const TRENDS_PALETTE = [
  '#b1c5ff',
  '#59d8de',
  '#d4bbff',
  '#a2e7ff',
  '#f59e0b',
  '#ef4444',
  '#6cd68f',
  '#8e909c',
];

type WeeklyVolumeItem = {
  muscle: string;
  setsThisWeek: number;
  mev: number;
  mrv: number;
  status: 'BELOW_MEV' | 'OPTIMAL' | 'ABOVE_MRV';
};

type StrengthHistoryPoint = {
  exerciseId: string;
  date: string;
  bestE1rm: number;
  bestWeight: number;
  bestReps?: number;
};

type StrengthTrendItem = {
  exercise: string;
  history: StrengthHistoryPoint[];
};

type InsightsPayload = {
  plateaus: Array<{
    id: string;
    reason: string;
    exercise?: { name?: string } | null;
  }>;
  progressionLogs: Array<{
    id: string;
    action?: string | null;
    actionLabel?: string | null;
    reason?: string | null;
    loggedAt?: string | null;
    exercise?: { name?: string } | null;
  }>;
} | null;

type VolumeTrendsItem = {
  week: string;
  muscles: Record<string, number>;
};

type SfrItem = {
  exerciseId: string;
  exerciseName: string;
  sfrScore: number;
  stimulusAvg: number;
  fatigueAvg: number;
  sampleSize: number;
};

function KinetiqLogoWithTealQ() {
  return (
    <span
      style={{
        fontFamily: 'Space Grotesk, sans-serif',
        fontWeight: 900,
        fontSize: 20,
        letterSpacing: '-0.04em',
      }}
    >
      <span
        style={{
          background: 'linear-gradient(90deg, #b1c5ff, #d4bbff)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        Kineti
      </span>
      <span style={{ color: '#59d8de' }}>q</span>
    </span>
  );
}

function tabButtonStyle(active: boolean): React.CSSProperties {
  return {
    flexShrink: 0,
    padding: '7px 16px',
    borderRadius: 100,
    border: active ? 'none' : `1px solid ${C.outlineVariant}`,
    background: active ? C.primary : 'transparent',
    color: active ? '#05080f' : C.onSurfaceVariant,
    fontSize: '0.72rem',
    fontFamily: 'Manrope, sans-serif',
    fontWeight: 700,
    letterSpacing: '0.05em',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'all 0.18s ease',
  };
}

function cardStyle(accent: string): React.CSSProperties {
  return {
    background: C.surfaceContainer,
    border: `1px solid ${C.outlineVariant}`,
    borderLeft: `3px solid ${accent}`,
    borderRadius: 16,
    padding: '14px 16px',
  };
}

function formatMuscleAbbrev(value: string): string {
  const map: Record<string, string> = {
    FRONT_DELT: 'F.Delt',
    SIDE_DELT: 'S.Delt',
    REAR_DELT: 'R.Delt',
    HAMSTRINGS: 'Hams',
    LOWER_BACK: 'L.Back',
    TRICEPS: 'Tri',
    BICEPS: 'Bi',
    GLUTES: 'Glutes',
    QUADS: 'Quads',
    CALVES: 'Calves',
    BACK: 'Back',
    CHEST: 'Chest',
    ABS: 'Abs',
    LATS: 'Lats',
  };
  return map[value] ?? value.replace(/_/g, ' ');
}

function formatWeekLabel(isoDate: string): string {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatRelativeTime(value?: string | null): string {
  if (!value) return 'Just now';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Just now';
  const diffMs = Date.now() - date.getTime();
  const day = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (day <= 0) return 'Today';
  if (day === 1) return '1 day ago';
  if (day < 30) return `${day} days ago`;
  const month = Math.floor(day / 30);
  if (month === 1) return '1 month ago';
  if (month < 12) return `${month} months ago`;
  const year = Math.floor(month / 12);
  return year === 1 ? '1 year ago' : `${year} years ago`;
}

function actionBadgeStyle(action?: string | null): React.CSSProperties {
  const val = (action ?? '').toUpperCase();
  if (val.includes('PROGRESS') || val.includes('LOAD')) {
    return {
      color: '#05080f',
      background: C.primary,
      border: `1px solid ${C.primary}`,
    };
  }
  if (val.includes('DELOAD') || val.includes('REDUCE')) {
    return {
      color: '#05080f',
      background: C.amber,
      border: `1px solid ${C.amber}`,
    };
  }
  if (val.includes('MAINTAIN') || val.includes('HOLD')) {
    return {
      color: C.onSurfaceVariant,
      background: C.surfaceHigh,
      border: `1px solid ${C.outlineVariant}`,
    };
  }
  return {
    color: C.onSurfaceVariant,
    background: C.surfaceHigh,
    border: `1px solid ${C.outlineVariant}`,
  };
}

export default function AnalyticsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  const [activeTab, setActiveTab] = useState<AnalyticsTab>('Volume');

  const [strengthTrends, setStrengthTrends] = useState<StrengthTrendItem[]>([]);
  const [weeklyVolume, setWeeklyVolume] = useState<WeeklyVolumeItem[]>([]);
  const [insights, setInsights] = useState<InsightsPayload>(null);
  const [loading, setLoading] = useState(true);

  const [volumeError, setVolumeError] = useState<string | null>(null);
  const [strengthError, setStrengthError] = useState<string | null>(null);
  const [insightsError, setInsightsError] = useState<string | null>(null);
  const [volumeLoading, setVolumeLoading] = useState(true);
  const [strengthLoading, setStrengthLoading] = useState(true);
  const [insightsLoading, setInsightsLoading] = useState(true);

  const [volumeTrends, setVolumeTrends] = useState<VolumeTrendsItem[]>([]);
  const [trendsLoading, setTrendsLoading] = useState(true);
  const [trendsError, setTrendsError] = useState<string | null>(null);

  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [selectedExerciseName, setSelectedExerciseName] = useState<string>('');
  const [drilldownHistory, setDrilldownHistory] = useState<StrengthHistoryPoint[]>([]);
  const [drilldownLoading, setDrilldownLoading] = useState(false);
  const [drilldownError, setDrilldownError] = useState<string | null>(null);

  const [showAllDecisions, setShowAllDecisions] = useState(false);

  const [sfrItems, setSfrItems] = useState<SfrItem[]>([]);
  const [sfrLoading, setSfrLoading] = useState(false);
  const [sfrError, setSfrError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth/login');
      return;
    }
    void loadData();
  }, []);

  async function loadData() {
    setVolumeLoading(true);
    setStrengthLoading(true);
    setInsightsLoading(true);
    setVolumeError(null);
    setStrengthError(null);
    setInsightsError(null);

    try {
      const [strengthRes, volumeRes, insightsRes] = await Promise.allSettled([
        api.get('/api/v1/analytics/strength/trends'),
        api.get('/api/v1/analytics/volume/weekly'),
        api.get('/api/v1/analytics/insights'),
      ]);
      if (strengthRes.status === 'fulfilled') {
        setStrengthTrends(strengthRes.value.data ?? []);
      } else {
        setStrengthError("Couldn't load strength data.");
      }
      if (volumeRes.status === 'fulfilled') {
        setWeeklyVolume(volumeRes.value.data ?? []);
      } else {
        setVolumeError("Couldn't load volume data.");
      }
      if (insightsRes.status === 'fulfilled') {
        setInsights(insightsRes.value.data ?? null);
      } else {
        setInsightsError("Couldn't load insights.");
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setStrengthTrends([]);
        setWeeklyVolume([]);
        setInsights(null);
        return;
      }
      console.error(err);
      setVolumeError("Couldn't load volume data.");
      setStrengthError("Couldn't load strength data.");
      setInsightsError("Couldn't load insights.");
    } finally {
      setLoading(false);
      setVolumeLoading(false);
      setStrengthLoading(false);
      setInsightsLoading(false);
    }
  }

  async function retryVolume() {
    setVolumeLoading(true);
    setVolumeError(null);
    try {
      const res = await api.get('/api/v1/analytics/volume/weekly');
      setWeeklyVolume(res.data ?? []);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return;
      setVolumeError("Couldn't load volume data.");
    } finally {
      setVolumeLoading(false);
    }
  }

  async function retryStrength() {
    setStrengthLoading(true);
    setStrengthError(null);
    try {
      const res = await api.get('/api/v1/analytics/strength/trends');
      setStrengthTrends(res.data ?? []);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return;
      setStrengthError("Couldn't load strength data.");
    } finally {
      setStrengthLoading(false);
    }
  }

  async function retryInsights() {
    setInsightsLoading(true);
    setInsightsError(null);
    try {
      const res = await api.get('/api/v1/analytics/insights');
      setInsights(res.data ?? null);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return;
      setInsightsError("Couldn't load insights.");
    } finally {
      setInsightsLoading(false);
    }
  }

  async function fetchVolumeTrends() {
    setTrendsLoading(true);
    setTrendsError(null);
    try {
      const res = await api.get('/api/v1/analytics/volume/trends');
      setVolumeTrends(res.data ?? []);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return;
      setTrendsError("Couldn't load trend data.");
      setVolumeTrends([]);
    } finally {
      setTrendsLoading(false);
    }
  }

  useEffect(() => {
    if (!isAuthenticated()) return;
    void fetchVolumeTrends();
  }, []);

  async function openStrengthDrilldown(exerciseId: string, exerciseName: string) {
    setSelectedExerciseId(exerciseId);
    setSelectedExerciseName(exerciseName);
    setDrilldownLoading(true);
    setDrilldownError(null);
    setDrilldownHistory([]);
    try {
      const res = await api.get(`/api/v1/analytics/e1rm/${exerciseId}`);
      setDrilldownHistory(res.data ?? []);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return;
      setDrilldownError("Couldn't load exercise trend.");
    } finally {
      setDrilldownLoading(false);
    }
  }

  async function retryDrilldown() {
    if (!selectedExerciseId) return;
    await openStrengthDrilldown(selectedExerciseId, selectedExerciseName);
  }

  async function fetchSfrScores(source: StrengthTrendItem[]) {
    if (!source.length) {
      setSfrItems([]);
      setSfrLoading(false);
      setSfrError(null);
      return;
    }

    const idToName = new Map<string, string>();
    source.forEach((row) => {
      const id = row.history?.[0]?.exerciseId;
      if (id) idToName.set(id, row.exercise);
    });

    const ids = [...idToName.keys()];
    if (!ids.length) {
      setSfrItems([]);
      setSfrLoading(false);
      setSfrError(null);
      return;
    }

    setSfrLoading(true);
    setSfrError(null);

    try {
      const results = await Promise.all(
        ids.map(async (exerciseId) => {
          const res = await api.get(`/api/v1/analytics/sfr/${exerciseId}`);
          return { exerciseId, exerciseName: idToName.get(exerciseId) ?? exerciseId, data: res.data };
        }),
      );

      const filtered = results
        .filter((r) => r.data && typeof r.data.sfrScore === 'number')
        .map((r) => ({
          exerciseId: r.exerciseId,
          exerciseName: r.exerciseName,
          sfrScore: r.data.sfrScore as number,
          stimulusAvg: (r.data.stimulusAvg as number) ?? 0,
          fatigueAvg: (r.data.fatigueAvg as number) ?? 0,
          sampleSize: (r.data.sampleSize as number) ?? 0,
        }))
        .sort((a, b) => b.sfrScore - a.sfrScore);

      setSfrItems(filtered);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return;
      setSfrError("Couldn't load SFR scores.");
      setSfrItems([]);
    } finally {
      setSfrLoading(false);
    }
  }

  useEffect(() => {
    void fetchSfrScores(strengthTrends);
  }, [strengthTrends]);

  const hasNoData = weeklyVolume.length === 0 && strengthTrends.every((t) => t.history.length === 0);

  const volumeChartData = weeklyVolume.map((item) => ({
    ...item,
    muscleShort: formatMuscleAbbrev(item.muscle),
    fill:
      item.status === 'BELOW_MEV'
        ? C.amber
        : item.status === 'ABOVE_MRV'
          ? C.red
          : C.green,
  }));

  const trendsMuscles = useMemo(() => {
    const keySet = new Set<string>();
    volumeTrends.forEach((row) => {
      Object.keys(row.muscles ?? {}).forEach((key) => keySet.add(key));
    });
    return [...keySet];
  }, [volumeTrends]);

  const trendsChartData = volumeTrends.map((row) => {
    const out: Record<string, string | number> = {
      week: formatWeekLabel(row.week),
    };
    trendsMuscles.forEach((m) => {
      out[m] = row.muscles?.[m] ?? 0;
    });
    return out;
  });

  const recentDecisions = insights?.progressionLogs ?? [];
  const visibleDecisions = showAllDecisions ? recentDecisions : recentDecisions.slice(0, 5);

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: C.surface,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: 13, color: C.outline }}>
          Loading analytics...
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: C.surface,
        color: C.onSurface,
        fontFamily: 'Manrope, sans-serif',
        paddingBottom: 110,
        overflowX: 'hidden',
      }}
    >
      <header
        style={{
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
        }}
      >
        <KinetiqLogoWithTealQ />
        <span
          style={{
            fontFamily: 'Manrope, sans-serif',
            fontSize: '0.57rem',
            fontWeight: 700,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: C.outline,
          }}
        >
          Stats
        </span>
      </header>

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '26px 16px 0' }}>
        <p
          style={{
            margin: '0 0 6px',
            fontSize: '0.57rem',
            letterSpacing: '0.24em',
            textTransform: 'uppercase',
            color: C.outline,
            fontWeight: 700,
          }}
        >
          Performance
        </p>
        <h1
          style={{
            fontFamily: 'Space Grotesk, sans-serif',
            fontWeight: 900,
            fontSize: 'clamp(1.85rem,6vw,2.4rem)',
            letterSpacing: '-0.045em',
            lineHeight: 1.05,
            color: C.onSurface,
            margin: '0 0 4px',
          }}
        >
          Analytics
        </h1>
        <p
          style={{
            fontFamily: 'Manrope, sans-serif',
            fontSize: 13,
            fontWeight: 500,
            color: C.outline,
            margin: '0 0 14px',
          }}
        >
          Your performance overview
        </p>

        <div
          style={{
            display: 'flex',
            gap: 8,
            overflowX: 'auto',
            paddingBottom: 6,
            marginBottom: 14,
            msOverflowStyle: 'none',
            scrollbarWidth: 'none',
          }}
        >
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={tabButtonStyle(activeTab === tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {hasNoData && activeTab === 'Volume' && !volumeLoading && !volumeError && (
          <div style={cardStyle(C.outline)}>
            <p style={{ margin: 0, color: C.onSurfaceVariant, fontSize: 12 }}>
              Complete sessions to start filling your analytics tabs.
            </p>
          </div>
        )}

        {activeTab === 'Volume' && (
          <div style={cardStyle(C.tertiary)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <BarChart2 size={15} color={C.tertiary} />
              <p
                style={{
                  margin: 0,
                  fontFamily: 'Space Grotesk, sans-serif',
                  fontSize: 13,
                  fontWeight: 800,
                }}
              >
                Weekly Volume
              </p>
            </div>

            {volumeLoading ? (
              <div
                style={{
                  height: 260,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4,1fr)',
                  gap: 10,
                  alignItems: 'end',
                }}
              >
                {[70, 110, 85, 130].map((h, i) => (
                  <div
                    key={i}
                    style={{
                      height: h,
                      borderRadius: 8,
                      background: C.surfaceHigh,
                      border: `1px solid ${C.outlineVariant}`,
                    }}
                  />
                ))}
              </div>
            ) : volumeError ? (
              <div style={{ textAlign: 'center', padding: '18px 8px' }}>
                <p style={{ margin: '0 0 10px', color: C.onSurfaceVariant, fontSize: 12 }}>
                  Couldn't load volume data.
                </p>
                <button
                  onClick={() => void retryVolume()}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 12,
                    border: 'none',
                    background: `linear-gradient(135deg, ${C.primary} 0%, #3a5cbf 100%)`,
                    color: '#05080f',
                    fontFamily: 'Space Grotesk, sans-serif',
                    fontWeight: 900,
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  Retry
                </button>
              </div>
            ) : weeklyVolume.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '18px 8px' }}>
                <p style={{ margin: 0, color: C.onSurfaceVariant, fontSize: 12 }}>
                  No volume data yet. Complete your first session to start tracking.
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={volumeChartData} margin={{ top: 8, right: 8, left: -10, bottom: 10 }}>
                  <CartesianGrid stroke={C.outlineVariant} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="muscleShort"
                    tick={{ fill: C.outline, fontSize: 11 }}
                    axisLine={{ stroke: C.outlineVariant }}
                    tickLine={{ stroke: C.outlineVariant }}
                  />
                  <YAxis
                    tick={{ fill: C.outline, fontSize: 11 }}
                    axisLine={{ stroke: C.outlineVariant }}
                    tickLine={{ stroke: C.outlineVariant }}
                  />
                  <Tooltip
                    cursor={{ fill: `${C.primary}18` }}
                    contentStyle={{
                      background: C.surfaceLow,
                      border: `1px solid ${C.outlineVariant}`,
                      borderRadius: 8,
                      color: C.onSurface,
                    }}
                    formatter={(value: any, _name: any, payload: any) => {
                      const p = payload?.payload as WeeklyVolumeItem | undefined;
                      if (!p) return [`${value} sets`, 'Sets'];
                      return [`${value} sets | MEV: ${p.mev} | MRV: ${p.mrv}`, 'Volume'];
                    }}
                  />
                  <ReferenceLine y={0} stroke="transparent" />
                  <Bar dataKey="setsThisWeek" radius={[8, 8, 0, 0]}>
                    {volumeChartData.map((row) => (
                      <Cell key={row.muscle} fill={row.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        )}

        {activeTab === 'Trends' && (
          <div style={cardStyle(C.secondary)}>
            <p
              style={{
                margin: '0 0 12px',
                fontFamily: 'Space Grotesk, sans-serif',
                fontSize: 13,
                fontWeight: 800,
              }}
            >
              Volume Trends
            </p>

            {trendsLoading ? (
              <div
                style={{
                  height: 300,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4,1fr)',
                  gap: 10,
                  alignItems: 'end',
                }}
              >
                {[120, 170, 90, 140].map((h, i) => (
                  <div
                    key={i}
                    style={{
                      height: h,
                      borderRadius: 8,
                      background: C.surfaceHigh,
                      border: `1px solid ${C.outlineVariant}`,
                    }}
                  />
                ))}
              </div>
            ) : trendsError ? (
              <div style={{ textAlign: 'center', padding: '18px 8px' }}>
                <p style={{ margin: '0 0 10px', color: C.onSurfaceVariant, fontSize: 12 }}>
                  Couldn't load trend data.
                </p>
                <button
                  onClick={() => void fetchVolumeTrends()}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 12,
                    border: 'none',
                    background: `linear-gradient(135deg, ${C.primary} 0%, #3a5cbf 100%)`,
                    color: '#05080f',
                    fontFamily: 'Space Grotesk, sans-serif',
                    fontWeight: 900,
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  Retry
                </button>
              </div>
            ) : trendsChartData.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '18px 8px' }}>
                <p style={{ margin: 0, color: C.onSurfaceVariant, fontSize: 12 }}>
                  Trend data builds after 2 weeks of logging.
                </p>
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={trendsChartData}
                    margin={{ top: 8, right: 8, left: -10, bottom: 12 }}
                  >
                    <CartesianGrid stroke={C.outlineVariant} strokeDasharray="3 3" />
                    <XAxis
                      dataKey="week"
                      tick={{ fill: C.outline, fontSize: 11 }}
                      axisLine={{ stroke: C.outlineVariant }}
                      tickLine={{ stroke: C.outlineVariant }}
                    />
                    <YAxis
                      tick={{ fill: C.outline, fontSize: 11 }}
                      axisLine={{ stroke: C.outlineVariant }}
                      tickLine={{ stroke: C.outlineVariant }}
                    />
                    <Tooltip
                      contentStyle={{
                        background: C.surfaceLow,
                        border: `1px solid ${C.outlineVariant}`,
                        borderRadius: 8,
                        color: C.onSurface,
                      }}
                    />
                    {trendsMuscles.map((muscle, idx) => (
                      <Bar
                        key={muscle}
                        dataKey={muscle}
                        fill={TRENDS_PALETTE[idx % TRENDS_PALETTE.length]}
                        radius={[3, 3, 0, 0]}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                  {trendsMuscles.map((muscle, idx) => (
                    <div key={muscle} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 2,
                          background: TRENDS_PALETTE[idx % TRENDS_PALETTE.length],
                        }}
                      />
                      <span style={{ fontSize: 10, color: C.onSurfaceVariant, fontWeight: 700 }}>
                        {formatMuscleAbbrev(muscle)}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'Strength' && (
          <div style={cardStyle(C.primary)}>
            {selectedExerciseId === null ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <TrendingUp size={15} color={C.primary} />
                  <p
                    style={{
                      margin: 0,
                      fontFamily: 'Space Grotesk, sans-serif',
                      fontSize: 13,
                      fontWeight: 800,
                    }}
                  >
                    Key Lifts
                  </p>
                </div>

                {strengthLoading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        style={{
                          border: `1px solid ${C.outlineVariant}`,
                          borderRadius: 12,
                          padding: 12,
                          background: C.surfaceLow,
                        }}
                      >
                        <div style={{ height: 13, width: '50%', background: C.surfaceHigh, borderRadius: 6, marginBottom: 8 }} />
                        <div style={{ height: 11, width: '35%', background: C.surfaceHigh, borderRadius: 6 }} />
                      </div>
                    ))}
                  </div>
                ) : strengthError ? (
                  <div style={{ textAlign: 'center', padding: '18px 8px' }}>
                    <p style={{ margin: '0 0 10px', color: C.onSurfaceVariant, fontSize: 12 }}>
                      Couldn't load strength data.
                    </p>
                    <button
                      onClick={() => void retryStrength()}
                      style={{
                        padding: '10px 14px',
                        borderRadius: 12,
                        border: 'none',
                        background: `linear-gradient(135deg, ${C.primary} 0%, #3a5cbf 100%)`,
                        color: '#05080f',
                        fontFamily: 'Space Grotesk, sans-serif',
                        fontWeight: 900,
                        fontSize: 13,
                        cursor: 'pointer',
                      }}
                    >
                      Retry
                    </button>
                  </div>
                ) : strengthTrends.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '18px 8px' }}>
                    <p style={{ margin: 0, color: C.onSurfaceVariant, fontSize: 12 }}>
                      Log more sessions to build strength trends.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {strengthTrends.map((lift) => {
                      const latest = lift.history[lift.history.length - 1];
                      const exerciseId = lift.history[0]?.exerciseId;
                      return (
                        <button
                          key={lift.exercise}
                          onClick={() => {
                            if (!exerciseId) return;
                            void openStrengthDrilldown(exerciseId, lift.exercise);
                          }}
                          style={{
                            border: `1px solid ${C.outlineVariant}`,
                            borderLeft: `3px solid ${C.primary}`,
                            borderRadius: 12,
                            padding: 12,
                            background: C.surfaceLow,
                            textAlign: 'left',
                            cursor: exerciseId ? 'pointer' : 'default',
                          }}
                        >
                          <p
                            style={{
                              margin: '0 0 4px',
                              fontFamily: 'Space Grotesk, sans-serif',
                              fontSize: 13,
                              fontWeight: 800,
                              color: C.onSurface,
                            }}
                          >
                            {lift.exercise}
                          </p>
                          <p style={{ margin: 0, fontSize: 11, color: C.onSurfaceVariant }}>
                            Latest e1RM: {latest ? `${Math.round(latest.bestE1rm)}kg` : '—'} • {lift.history.length} sessions
                          </p>
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    setSelectedExerciseId(null);
                    setSelectedExerciseName('');
                    setDrilldownHistory([]);
                    setDrilldownError(null);
                  }}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    padding: 0,
                    color: C.primary,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    marginBottom: 10,
                  }}
                >
                  ← All exercises
                </button>

                <p
                  style={{
                    margin: '0 0 10px',
                    fontFamily: 'Space Grotesk, sans-serif',
                    fontSize: 14,
                    fontWeight: 800,
                    color: C.onSurface,
                  }}
                >
                  {selectedExerciseName}
                </p>

                {drilldownLoading ? (
                  <div
                    style={{
                      height: 240,
                      border: `1px solid ${C.outlineVariant}`,
                      borderRadius: 12,
                      background: C.surfaceLow,
                      display: 'grid',
                      gridTemplateColumns: 'repeat(5,1fr)',
                      gap: 8,
                      alignItems: 'end',
                      padding: 10,
                    }}
                  >
                    {[70, 110, 90, 140, 120].map((h, i) => (
                      <div key={i} style={{ height: h, background: C.surfaceHigh, borderRadius: 8 }} />
                    ))}
                  </div>
                ) : drilldownError ? (
                  <div style={{ textAlign: 'center', padding: '18px 8px' }}>
                    <p style={{ margin: '0 0 10px', color: C.onSurfaceVariant, fontSize: 12 }}>
                      Couldn't load strength data.
                    </p>
                    <button
                      onClick={() => void retryDrilldown()}
                      style={{
                        padding: '10px 14px',
                        borderRadius: 12,
                        border: 'none',
                        background: `linear-gradient(135deg, ${C.primary} 0%, #3a5cbf 100%)`,
                        color: '#05080f',
                        fontFamily: 'Space Grotesk, sans-serif',
                        fontWeight: 900,
                        fontSize: 13,
                        cursor: 'pointer',
                      }}
                    >
                      Retry
                    </button>
                  </div>
                ) : drilldownHistory.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '18px 8px' }}>
                    <p style={{ margin: 0, color: C.onSurfaceVariant, fontSize: 12 }}>
                      Not enough data for this exercise yet.
                    </p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <LineChart data={drilldownHistory} margin={{ top: 8, right: 10, left: -10, bottom: 8 }}>
                      <CartesianGrid stroke={C.outlineVariant} strokeDasharray="3 3" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(v) => formatWeekLabel(v)}
                        tick={{ fill: C.outline, fontSize: 11 }}
                        axisLine={{ stroke: C.outlineVariant }}
                        tickLine={{ stroke: C.outlineVariant }}
                      />
                      <YAxis
                        tick={{ fill: C.outline, fontSize: 11 }}
                        axisLine={{ stroke: C.outlineVariant }}
                        tickLine={{ stroke: C.outlineVariant }}
                      />
                      <Tooltip
                        contentStyle={{
                          background: C.surfaceLow,
                          border: `1px solid ${C.outlineVariant}`,
                          borderRadius: 8,
                          color: C.onSurface,
                        }}
                        labelFormatter={(v) => formatWeekLabel(String(v))}
                        formatter={(value: any, _name: any, payload: any) => {
                          const p = payload?.payload as StrengthHistoryPoint | undefined;
                          if (!p) return [value, 'e1RM'];
                          return [`${value}kg | W: ${p.bestWeight}kg | R: ${p.bestReps ?? '—'}`, 'e1RM'];
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="bestE1rm"
                        stroke={C.primary}
                        strokeWidth={2.5}
                        dot={{ r: 4, fill: C.primary }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'Insights' && (
          <div style={cardStyle(C.amber)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Zap size={15} color={C.amber} />
              <p
                style={{
                  margin: 0,
                  fontFamily: 'Space Grotesk, sans-serif',
                  fontSize: 13,
                  fontWeight: 800,
                }}
              >
                Coaching Insights
              </p>
            </div>

            {insightsLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    style={{
                      border: `1px solid ${C.outlineVariant}`,
                      borderRadius: 12,
                      padding: 12,
                      background: C.surfaceLow,
                    }}
                  >
                    <div style={{ height: 13, width: '48%', background: C.surfaceHigh, borderRadius: 6, marginBottom: 8 }} />
                    <div style={{ height: 11, width: '66%', background: C.surfaceHigh, borderRadius: 6 }} />
                  </div>
                ))}
              </div>
            ) : insightsError ? (
              <div style={{ textAlign: 'center', padding: '18px 8px' }}>
                <p style={{ margin: '0 0 10px', color: C.onSurfaceVariant, fontSize: 12 }}>
                  Couldn't load insights.
                </p>
                <button
                  onClick={() => void retryInsights()}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 12,
                    border: 'none',
                    background: `linear-gradient(135deg, ${C.primary} 0%, #3a5cbf 100%)`,
                    color: '#05080f',
                    fontFamily: 'Space Grotesk, sans-serif',
                    fontWeight: 900,
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  Retry
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <p
                    style={{
                      margin: '0 0 8px',
                      fontFamily: 'Space Grotesk, sans-serif',
                      fontSize: 12,
                      fontWeight: 800,
                      color: C.onSurface,
                    }}
                  >
                    Plateaus Detected
                  </p>

                  {insights?.plateaus?.length ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {insights.plateaus.map((plateau) => (
                        <div
                          key={plateau.id}
                          style={{
                            border: `1px solid ${C.outlineVariant}`,
                            borderRadius: 10,
                            background: C.surfaceLow,
                            padding: '10px 12px',
                          }}
                        >
                          <p style={{ margin: '0 0 4px', fontSize: 12, color: C.onSurface, fontWeight: 700 }}>
                            {plateau.exercise?.name ?? 'Unknown exercise'}
                          </p>
                          <span
                            style={{
                              fontSize: 10,
                              letterSpacing: '0.08em',
                              textTransform: 'uppercase',
                              fontWeight: 800,
                              color: '#05080f',
                              background: C.amber,
                              borderRadius: 6,
                              padding: '3px 7px',
                            }}
                          >
                            Plateau detected
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ margin: 0, fontSize: 12, color: C.onSurfaceVariant }}>
                      No plateaus detected. Progress is on track.
                    </p>
                  )}
                </div>

                <div>
                  <p
                    style={{
                      margin: '0 0 8px',
                      fontFamily: 'Space Grotesk, sans-serif',
                      fontSize: 12,
                      fontWeight: 800,
                      color: C.onSurface,
                    }}
                  >
                    Recent Prescriptions
                  </p>

                  {recentDecisions.length ? (
                    <>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {visibleDecisions.map((log) => (
                          <div
                            key={log.id}
                            style={{
                              border: `1px solid ${C.outlineVariant}`,
                              borderRadius: 10,
                              background: C.surfaceLow,
                              padding: '10px 12px',
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                gap: 8,
                              }}
                            >
                              <p style={{ margin: 0, fontSize: 12, color: C.onSurface, fontWeight: 700 }}>
                                {log.exercise?.name ?? 'Unknown exercise'}
                              </p>
                              <span
                                style={{
                                  fontSize: 10,
                                  fontWeight: 800,
                                  letterSpacing: '0.08em',
                                  textTransform: 'uppercase',
                                  borderRadius: 6,
                                  padding: '3px 7px',
                                  ...actionBadgeStyle(log.actionLabel ?? log.action),
                                }}
                              >
                                {log.actionLabel ?? log.action ?? 'ACTION'}
                              </span>
                            </div>
                            <p style={{ margin: '5px 0 0', fontSize: 11, color: C.onSurfaceVariant }}>
                              {log.reason ?? 'No reason provided.'}
                            </p>
                            <p style={{ margin: '5px 0 0', fontSize: 10, color: C.outline }}>
                              {formatRelativeTime(log.loggedAt)}
                            </p>
                          </div>
                        ))}
                      </div>

                      {recentDecisions.length > 5 && (
                        <button
                          onClick={() => setShowAllDecisions((v) => !v)}
                          style={{
                            marginTop: 8,
                            border: 'none',
                            background: 'transparent',
                            color: C.primary,
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: 'pointer',
                            padding: 0,
                          }}
                        >
                          {showAllDecisions ? 'Show less' : 'View all'}
                        </button>
                      )}
                    </>
                  ) : (
                    <p style={{ margin: 0, fontSize: 12, color: C.onSurfaceVariant }}>
                      No prescription history yet.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'SFR' && (
          <div style={cardStyle(C.primary)}>
            <p
              style={{
                margin: '0 0 10px',
                fontFamily: 'Space Grotesk, sans-serif',
                fontSize: 13,
                fontWeight: 800,
              }}
            >
              Stimulus-to-Fatigue Ranking
            </p>

            {sfrLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    style={{
                      border: `1px solid ${C.outlineVariant}`,
                      borderRadius: 12,
                      padding: 12,
                      background: C.surfaceLow,
                    }}
                  >
                    <div style={{ height: 13, width: '52%', background: C.surfaceHigh, borderRadius: 6, marginBottom: 8 }} />
                    <div style={{ height: 11, width: '40%', background: C.surfaceHigh, borderRadius: 6 }} />
                  </div>
                ))}
              </div>
            ) : sfrError ? (
              <div style={{ textAlign: 'center', padding: '18px 8px' }}>
                <p style={{ margin: '0 0 10px', color: C.onSurfaceVariant, fontSize: 12 }}>
                  Couldn't load SFR scores.
                </p>
                <button
                  onClick={() => void fetchSfrScores(strengthTrends)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 12,
                    border: 'none',
                    background: `linear-gradient(135deg, ${C.primary} 0%, #3a5cbf 100%)`,
                    color: '#05080f',
                    fontFamily: 'Space Grotesk, sans-serif',
                    fontWeight: 900,
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  Retry
                </button>
              </div>
            ) : sfrItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '18px 8px' }}>
                <p style={{ margin: 0, color: C.onSurfaceVariant, fontSize: 12 }}>
                  SFR scores calculate after sufficient logged sessions.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {sfrItems.map((item, idx) => {
                  const scoreColor =
                    item.sfrScore >= 3.5
                      ? C.tertiary
                      : item.sfrScore >= 2.5
                        ? C.primary
                        : C.surfaceHigh;
                  const scoreTextColor = item.sfrScore >= 2.5 ? '#05080f' : C.onSurfaceVariant;
                  return (
                    <div
                      key={item.exerciseId}
                      style={{
                        border: `1px solid ${C.outlineVariant}`,
                        borderRadius: 10,
                        background: C.surfaceLow,
                        padding: '10px 12px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <div>
                        <p style={{ margin: '0 0 4px', fontSize: 12, color: C.onSurface, fontWeight: 700 }}>
                          #{idx + 1} {item.exerciseName}
                        </p>
                        <p style={{ margin: 0, fontSize: 10, color: C.outline }}>
                          S: {item.stimulusAvg.toFixed(2)} / F: {item.fatigueAvg.toFixed(2)}
                        </p>
                      </div>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 900,
                          fontFamily: 'Space Grotesk, sans-serif',
                          borderRadius: 8,
                          padding: '6px 10px',
                          background: scoreColor,
                          color: scoreTextColor,
                          letterSpacing: '0.02em',
                        }}
                      >
                        {item.sfrScore.toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}